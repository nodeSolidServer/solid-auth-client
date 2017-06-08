import nock from 'nock'
import URLSearchParams from 'url-search-params'

import { currentUser, login, memStorage } from './'

let _href
let _URL

beforeEach(() => {
  // polyfill missing web apis
  _href = window.location.href
  Object.defineProperty(window.location, 'href', {
    writable: true,
    value: 'https://app.biz/'
  })
  _URL = URL
  window.URL = function (urlStr) {
    const url = new _URL(urlStr)
    url.searchParams = new URLSearchParams(url.search)
    return url
  }
  window.URLSearchParams = URLSearchParams
  window.localStorage = memStorage()
})

afterEach(() => {
  delete window.localStorage
  delete window.URLSearchParams
  window.URL = _URL
  window.location.href = _href
})

const oidcConfiguration = {
  issuer:                 'https://localhost',
  jwks_uri:               'https://localhost/jwks',
  registration_endpoint:  'https://localhost/register',
  authorization_endpoint: 'https://localhost/authorize'
}

const jwks = {
  keys: []
}

const oidcRegistration = {
  client_id: 'abc123'
}

describe('login', () => {
  beforeEach(() => {
    nock.disableNetConnect()
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  describe('WebID-TLS', () => {
    it('can log in with WebID-TLS', () => {
      const webId = 'https://localhost/profile#me'
      nock('https://localhost/')
        .options('/')
        .reply(200, '', { user: webId })

      return login('https://localhost')
        .then(({ webId: _webId }) => {
          expect(_webId).toBe(webId)
        })
    })
  })

  describe('WebID-OIDC', () => {
    it('can log in with WebID-OIDC', () => {
      nock('https://localhost/')
        .options('/')
        .reply(200)
        .get('/.well-known/openid-configuration')
        .reply(200, oidcConfiguration)
        .get('/jwks')
        .reply(200, jwks)
        .post('/register')
        .reply(200, oidcRegistration)

      return login('https://localhost')
        .then(() => {
          const location = new URL(window.location.href)
          expect(location.origin).toEqual('https://localhost')
          expect(location.pathname).toEqual('/authorize')
          expect(location.searchParams.get('redirect_uri')).toEqual('https://app.biz/')
          expect(location.searchParams.get('response_type')).toEqual('id_token token')
          expect(location.searchParams.get('scope')).toEqual('openid')
          expect(location.searchParams.get('client_id')).toEqual('abc123')
        })
    })

    it('uses the provided redirect uri', () => {
      nock('https://localhost')
        .options('/')
        .reply(200)
        .get('/.well-known/openid-configuration')
        .reply(200, oidcConfiguration)
        .get('/jwks')
        .reply(200, jwks)
        .post('/register')
        .reply(200, oidcRegistration)

      return login('https://localhost', { redirectUri: 'https://app.biz/welcome/' })
        .then(() => {
          const location = new URL(window.location.href)
          expect(location.origin).toEqual('https://localhost')
          expect(location.pathname).toEqual('/authorize')
          expect(location.searchParams.get('redirect_uri')).toEqual('https://app.biz/welcome/')
          expect(location.searchParams.get('response_type')).toEqual('id_token token')
          expect(location.searchParams.get('scope')).toEqual('openid')
          expect(location.searchParams.get('client_id')).toEqual('abc123')
        })
    })

    it('resolves to a `null` WebID when none of the recognized auth schemes are available')
  })
})

describe('currentUser', () => {
  describe('WebID-TLS', () => {
    it('can find the current user', () => {
      const webId = 'https://localhost/profile#me'
      nock('https://localhost/')
        .options('/')
        .reply(200, '', { user: webId })

      return currentUser('https://localhost')
        .then(({ webId: _webId }) => {
          expect(_webId).toBe(webId)
        })
    })
  })

  describe('WebID-OIDC', () => {
    it('can find the current user if stored')

    it('resolves to a `null` WebID when there is no stored user session')
  })
})

describe('fetch', () => {
  it('Handles 401s from WebID-OIDC resources by resending with credentials')

  it('Only resends with credentials for resources in the whitelist')

  it('Resends with credentials for all resources if the whitelist is not provided')
})
