import URLSearchParams from 'url-search-params'
import nock from 'nock'

import { login } from './'

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'user',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'OPTIONS, HEAD, GET, PUT, POST, PATCH'
}

const mockLocalStorage = () => {
  const store = {}
  return {
    getItem (key) {
      return store[key]
    },
    setItem (key, val) {
      store[key] = val
    }
  }
}

beforeEach(() => {
  // polyfill missing web apis
  window.localStorage = mockLocalStorage()
  window.URLSearchParams = URLSearchParams
  window.location = { href: 'https://app.biz/' }
  window._URL = URL
  window.URL = function (urlStr) {
    const url = new _URL(urlStr)
    url.searchParams = new URLSearchParams(url.search)
    return url
  }
})

afterEach(() => {
  delete window.localStorage
  delete window.URLSearchParams
  delete window.location
  window.URL = window._URL
})

const oidcConfiguration = {
  issuer: 'https://example.com',
  jwks_uri: 'https://example.com/jwks',
  registration_endpoint: 'https://example.com/register',
  authorization_endpoint: 'https://example.com/authorize'
}

const jwks = {
  keys: []
}

const oidcRegistration = {
  client_id: 'abc123'
}

describe('login', () => {
  afterEach(nock.cleanAll)

  it('can log in with WebID-TLS', () => {
    const webId = 'https://example.com/profile#me'
    nock('https://example.com/')
      .options('/')
      .reply(200, '', corsHeaders)
      .options('/')
      .reply(200, '', { ...corsHeaders, user: webId })

    return login('https://example.com')
      .then(({ webId: _webId }) => {
        expect(_webId).toBe(webId)
      })
  })

  it('can log in with WebID-OIDC', () => {
    nock('https://example.com/')
      .options('/')
      .reply(200, '', corsHeaders)
      .options('/')
      .reply(200, '', corsHeaders)
      .get('/.well-known/openid-configuration')
      .reply(200, oidcConfiguration, corsHeaders)
      .get('/jwks')
      .reply(200, jwks, corsHeaders)
      .post('/register')
      .reply(200, oidcRegistration, corsHeaders)

    return login('https://example.com')
      .then(() => {
        const location = new URL(window.location.href)
        expect(location.origin).toEqual('https://example.com')
        expect(location.pathname).toEqual('/authorize')
        expect(location.searchParams.get('redirect_uri')).toEqual('https://app.biz/')
        expect(location.searchParams.get('response_type')).toEqual('id_token token')
        expect(location.searchParams.get('scope')).toEqual('openid')
        expect(location.searchParams.get('client_id')).toEqual('abc123')
      })
  })
})

describe('fetch', () => {
  it('Handles 401s from WebID-OIDC resources by resending with credentials')

  it('Only resends with credentials for resources in the whitelist')

  it('Resends with credentials for all resources if the whitelist is not provided')
})
