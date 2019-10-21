/* eslint-env jest */
import fs from 'fs'
import path from 'path'
import jwt from 'jsonwebtoken'
import nock from 'nock'
import rsaPemToJwk from 'rsa-pem-to-jwk'

import SolidAuthClient from '../solid-auth-client'
import { saveHost } from '../host'
import { getSession, saveSession } from '../session'
import { polyfillWindow, polyunfillWindow } from './spec-helpers'
import { asyncStorage } from '../storage'
import { sessionKeys } from './session-keys'

const instance = new SolidAuthClient()

/*
 * OIDC test data:
 *   1) the oidc configuration returned from '/.well-known/openid-configuration'
 *   2) the registration response
 *   3) the json web key set
 */

const oidcConfiguration = {
  issuer: 'https://localhost',
  jwks_uri: 'https://localhost/jwks',
  registration_endpoint: 'https://localhost/register',
  authorization_endpoint: 'https://localhost/authorize',
  end_session_endpoint: 'https://localhost/logout'
}

const oidcRegistration = {
  client_id: 'the-client-id'
}

const pem = fs.readFileSync(path.join(__dirname, './id_rsa'))

const jwks = {
  keys: [
    rsaPemToJwk(
      // the PEM-encoded key
      pem,
      // extra data for the JWK
      { kid: '1', alg: 'RS256', use: 'sig', key_ops: ['verify'] },
      // serialize just the public key
      'public'
    )
  ]
}

const sessionKey = JSON.stringify(sessionKeys.private)

const verifySerializedKey = ssk => {
  const key = JSON.parse(ssk)
  const actualFields = Object.keys(key)
  const expectedFields = [
    'kty',
    'alg',
    'n',
    'e',
    'd',
    'p',
    'q',
    'dp',
    'dq',
    'qi',
    'key_ops',
    'ext'
  ]
  expect(new Set(actualFields)).toEqual(new Set(expectedFields))
}

const fakeSession = {
  idp: 'https://localhost',
  webId: 'https://person.me/#me',
  authorization: {
    access_token: 'fake_access_token',
    id_token: 'abc.def.ghi'
  },
  sessionKey
}

beforeEach(() => {
  polyfillWindow()
  nock.disableNetConnect()
  instance.removeAllListeners('login')
  instance.removeAllListeners('logout')
  instance.removeAllListeners('session')
})

afterEach(() => {
  polyunfillWindow()
  nock.cleanAll()
  nock.enableNetConnect()
})

const getStoredSession = () => getSession(asyncStorage(window.localStorage))

describe('login', () => {
  beforeEach(() => {
    nock.disableNetConnect()
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  it('returns an anonymous auth response when no recognized auth scheme is present', async () => {
    expect.assertions(2)
    nock('https://localhost')
      .head('/')
      .reply(200)
      .get('/.well-known/openid-configuration')
      .reply(404)

    const session = await instance.login('https://localhost')
    expect(session).toBeNull()
    expect(await getStoredSession()).toBeNull()
  })

  describe('WebID-OIDC', () => {
    it('can log in with WebID-OIDC', async () => {
      expect.assertions(6)
      nock('https://localhost/')
        .get('/.well-known/openid-configuration')
        .reply(200, oidcConfiguration)
        .get('/jwks')
        .reply(200, jwks)
        .post('/register')
        .reply(200, oidcRegistration)

      await instance.login('https://localhost')
      const location = new window.URL(window.location.href)
      expect(location.origin).toEqual('https://localhost')
      expect(location.pathname).toEqual('/authorize')
      expect(location.searchParams.get('redirect_uri')).toEqual(
        'https://app.biz/'
      )
      expect(location.searchParams.get('response_type')).toEqual(
        'id_token token'
      )
      expect(location.searchParams.get('scope')).toEqual('openid')
      expect(location.searchParams.get('client_id')).toEqual('the-client-id')
    })

    it('uses the provided redirect uri', async () => {
      expect.assertions(6)
      nock('https://localhost')
        .get('/.well-known/openid-configuration')
        .reply(200, oidcConfiguration)
        .get('/jwks')
        .reply(200, jwks)
        .post('/register')
        .reply(200, oidcRegistration)

      await instance.login('https://localhost', {
        callbackUri: 'https://app.biz/welcome/'
      })
      const location = new window.URL(window.location.href)
      expect(location.origin).toEqual('https://localhost')
      expect(location.pathname).toEqual('/authorize')
      expect(location.searchParams.get('redirect_uri')).toEqual(
        'https://app.biz/welcome/'
      )
      expect(location.searchParams.get('response_type')).toEqual(
        'id_token token'
      )
      expect(location.searchParams.get('scope')).toEqual('openid')
      expect(location.searchParams.get('client_id')).toEqual('the-client-id')
    })

    it('strips the hash fragment from the current URL when providing the default redirect URL', async () => {
      expect.assertions(6)
      nock('https://localhost/')
        .get('/.well-known/openid-configuration')
        .reply(200, oidcConfiguration)
        .get('/jwks')
        .reply(200, jwks)
        .post('/register')
        .reply(200, oidcRegistration)

      window.location.href += '#foo-bar'

      await instance.login('https://localhost')
      const location = new window.URL(window.location.href)
      expect(location.origin).toEqual('https://localhost')
      expect(location.pathname).toEqual('/authorize')
      expect(location.searchParams.get('redirect_uri')).toEqual(
        'https://app.biz/'
      )
      expect(location.searchParams.get('response_type')).toEqual(
        'id_token token'
      )
      expect(location.searchParams.get('scope')).toEqual('openid')
      expect(location.searchParams.get('client_id')).toEqual('the-client-id')
    })
  })
})

describe('currentSession', () => {
  it('can find the current session if stored', async () => {
    expect.assertions(2)
    await saveSession(window.localStorage)(fakeSession)

    const session = await instance.currentSession()
    expect(session.webId).toBe('https://person.me/#me')
    expect(await getStoredSession()).toEqual(session)
  })

  it('resolves to a `null` session when there is no stored session or OIDC response', async () => {
    expect.assertions(2)
    const session = await instance.currentSession()
    expect(session).toBeNull()
    expect(await getStoredSession()).toBeNull()
  })

  describe('WebID-OIDC', () => {
    let expectedIdToken, expectedAccessToken
    let loginEvents, sessionEvents

    beforeEach(async () => {
      loginEvents = []
      sessionEvents = []
      instance.on('login', (...params) => loginEvents.push(params))
      instance.on('session', (...params) => sessionEvents.push(params))

      // To test currentSession with WebID-OIDC it's easist to set up the OIDC RP
      // client by logging in, generating the IDP's response, and redirecting
      // back to the app.
      nock('https://localhost/')
        .get('/.well-known/openid-configuration')
        .reply(200, oidcConfiguration)
        .get('/jwks')
        .reply(200, jwks)
        .post('/register')
        .reply(200, oidcRegistration)
        // see https://github.com/anvilresearch/oidc-rp/issues/29
        .get('/jwks')
        .reply(200, jwks)

      window.location.href = 'https://app.biz/page?foo=bar#the-hash-fragment'
      await instance.login('https://localhost')
      // generate the auth response
      const location = new window.URL(window.location.href)
      const state = location.searchParams.get('state')
      const callbackUri = location.searchParams.get('redirect_uri')
      const nonce = location.searchParams.get('nonce')
      const accessToken = 'example_access_token'
      const { alg } = jwks.keys[0]
      const idToken = jwt.sign(
        {
          iss: oidcConfiguration.issuer,
          aud: oidcRegistration.client_id,
          exp: Math.floor(Date.now() / 1000) + 60 * 60, // one hour
          sub: 'https://person.me/#me',
          nonce
        },
        pem,
        { algorithm: alg }
      )
      expectedIdToken = idToken
      expectedAccessToken = accessToken
      window.location.href =
        `${callbackUri}#` +
        `access_token=${accessToken}&` +
        `token_type=Bearer&` +
        `id_token=${idToken}&` +
        `state=${state}`
    })

    it('can find the current session from the URL auth response', async () => {
      expect.assertions(6)
      const session = await instance.currentSession()
      const { authorization } = session
      expect(session.webId).toBe('https://person.me/#me')
      expect(authorization.access_token).toBe(expectedAccessToken)
      expect(authorization.id_token).toBe(expectedIdToken)
      verifySerializedKey(session.sessionKey)
      expect(await getStoredSession()).toEqual(session)
      expect(window.location.hash).toBe('#the-hash-fragment')
    })

    it('triggers the login event on first call', async () => {
      expect.assertions(1)
      await instance.currentSession()
      expect(loginEvents).toHaveLength(1)
    })

    it('passes the session as parameter to the login event', async () => {
      expect.assertions(4)
      await instance.currentSession()
      expect(loginEvents).toHaveLength(1)
      expect(loginEvents[0]).toHaveLength(1)

      const session = loginEvents[0][0]
      expect(session).toBeInstanceOf(Object)
      expect(session.webId).toBe('https://person.me/#me')
    })

    it('does not trigger the login event on subsequent calls', async () => {
      expect.assertions(1)
      await instance.currentSession()
      await instance.currentSession()
      expect(loginEvents).toHaveLength(1)
    })

    it('triggers the session event on first call', async () => {
      expect.assertions(1)
      await instance.currentSession()
      expect(sessionEvents).toHaveLength(1)
    })

    it('passes the session as parameter to the session event', async () => {
      expect.assertions(4)
      await instance.currentSession()
      expect(sessionEvents).toHaveLength(1)
      expect(sessionEvents[0]).toHaveLength(1)

      const session = sessionEvents[0][0]
      expect(session).toBeInstanceOf(Object)
      expect(session.webId).toBe('https://person.me/#me')
    })

    it('does not trigger the session event on subsequent calls', async () => {
      expect.assertions(1)
      await instance.currentSession()
      await instance.currentSession()
      expect(sessionEvents).toHaveLength(1)
    })
  })
})

describe('trackSession', () => {
  it('yields null if there is no active session', async () => {
    expect.assertions(2)
    const callback = jest.fn()
    await instance.trackSession(callback)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenLastCalledWith(null)
  })

  it('yields an active session', async () => {
    expect.assertions(2)
    const session = {}
    await saveSession(window.localStorage)(session)

    const callback = jest.fn()
    await instance.trackSession(callback)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenLastCalledWith(session)
  })

  it('calls the callback on login', async () => {
    expect.assertions(4)

    const callback = jest.fn()
    await instance.trackSession(callback)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenLastCalledWith(null)

    const session = {}
    instance.emit('session', session)
    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenLastCalledWith(session)
  })

  it('calls the callback on logout', async () => {
    expect.assertions(4)
    const session = {}
    await saveSession(window.localStorage)(session)

    const callback = jest.fn()
    await instance.trackSession(callback)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenLastCalledWith(session)

    await instance.logout()
    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenLastCalledWith(null)
  })
})

describe('logout', () => {
  describe('WebID-OIDC', () => {
    let expectedIdToken, expectedAccessToken
    let logoutEvents, sessionEvents

    beforeEach(async () => {
      logoutEvents = []
      sessionEvents = []
      instance.on('logout', (...params) => logoutEvents.push(params))
      instance.on('session', (...params) => sessionEvents.push(params))

      // To test currentSession with WebID-OIDC it's easist to set up the OIDC RP
      // client by logging in, generating the IDP's response, and redirecting
      // back to the app.
      nock('https://localhost/')
        .get('/.well-known/openid-configuration')
        .reply(200, oidcConfiguration)
        .get('/jwks')
        .reply(200, jwks)
        .post('/register')
        .reply(200, oidcRegistration)
        // no luck, try with WebID-OIDC
        // see https://github.com/anvilresearch/oidc-rp/issues/29
        .get('/jwks')
        .reply(200, jwks)
        .get('/logout')
        .reply(200)

      window.location.href = 'https://app.biz/page?foo=bar#the-hash-fragment'
      await instance.login('https://localhost')
      // generate the auth response
      const location = new window.URL(window.location.href)
      const state = location.searchParams.get('state')
      const callbackUri = location.searchParams.get('redirect_uri')
      const nonce = location.searchParams.get('nonce')
      const accessToken = 'example_access_token'
      const { alg } = jwks.keys[0]
      const idToken = jwt.sign(
        {
          iss: oidcConfiguration.issuer,
          aud: oidcRegistration.client_id,
          exp: Math.floor(Date.now() / 1000) + 60 * 60, // one hour
          sub: 'https://person.me/#me',
          nonce
        },
        pem,
        { algorithm: alg }
      )
      expectedIdToken = idToken
      expectedAccessToken = accessToken
      window.location.href =
        `${callbackUri}#` +
        `access_token=${accessToken}&` +
        `token_type=Bearer&` +
        `id_token=${idToken}&` +
        `state=${state}`
    })

    it('hits the end_session_endpoint and clears the current session from the store', async () => {
      expect.assertions(7)
      const session = await instance.currentSession()
      const { authorization } = session
      expect(session.webId).toBe('https://person.me/#me')
      expect(authorization.access_token).toBe(expectedAccessToken)
      expect(authorization.id_token).toBe(expectedIdToken)
      verifySerializedKey(session.sessionKey)
      expect(window.location.hash).toBe('#the-hash-fragment')
      const storedSession = await getStoredSession()
      expect(storedSession).toEqual(session)
      await instance.logout()
      expect(await getStoredSession()).toBeNull()
    })

    it('triggers the logout event on first call', async () => {
      expect.assertions(1)
      await instance.currentSession()
      await instance.logout()
      expect(logoutEvents).toHaveLength(1)
    })

    it('does not trigger the logout event on subsequent calls', async () => {
      expect.assertions(1)
      await instance.currentSession()
      await instance.logout()
      await instance.logout()
      expect(logoutEvents).toHaveLength(1)
    })

    it('triggers the session event on first call', async () => {
      expect.assertions(1)
      await instance.currentSession()
      await instance.logout()
      expect(sessionEvents).toHaveLength(2)
    })

    it('passes null as parameter to the session event', async () => {
      expect.assertions(3)
      await instance.currentSession()
      await instance.logout()
      expect(sessionEvents).toHaveLength(2)
      expect(sessionEvents[1]).toHaveLength(1)

      const session = sessionEvents[1][0]
      expect(session).toBeNull()
    })

    it('does not trigger the session event on subsequent calls', async () => {
      expect.assertions(1)
      await instance.currentSession()
      await instance.logout()
      await instance.logout()
      expect(sessionEvents).toHaveLength(2)
    })
  })
})

describe('fetch', () => {
  const matchAuthzHeader = origin => headerVal => {
    const popToken = jwt.decode(headerVal[0].split(' ')[1])
    return (
      popToken.aud === origin &&
      popToken.id_token === 'abc.def.ghi' &&
      popToken.token_type === 'pop'
    )
  }

  it('fires the request event', async () => {
    nock('https://third-party.com')
      .get('/resource')
      .reply(200)

    const allArgs = []
    const collectArgs = allArgs.push.bind(allArgs)
    instance.on('request', collectArgs)
    await instance.fetch('https://third-party.com/resource')
    instance.removeListener('request', collectArgs)

    expect(allArgs).toEqual(['https://third-party.com/resource'])
  })

  it('handles 401s from WebID-OIDC resources by resending with credentials', async () => {
    expect.assertions(1)
    await saveSession(window.localStorage)(fakeSession)

    nock('https://third-party.com')
      .get('/protected-resource')
      .reply(401, '', { 'www-authenticate': 'Bearer scope="openid webid"' })
      .get('/protected-resource')
      .matchHeader('authorization', matchAuthzHeader('https://third-party.com'))
      .reply(200)

    const resp = await instance.fetch(
      'https://third-party.com/protected-resource'
    )
    expect(resp.status).toBe(200)
  })

  it('merges request headers with the authorization header', async () => {
    await saveSession(window.localStorage)(fakeSession)

    nock('https://third-party.com')
      .get('/private-resource')
      .reply(401, '', { 'www-authenticate': 'Bearer scope="openid webid"' })
      .get('/private-resource')
      .matchHeader('accept', 'text/plain')
      .matchHeader('authorization', matchAuthzHeader('https://third-party.com'))
      .reply(200)

    const resp = await instance.fetch(
      'https://third-party.com/private-resource',
      {
        headers: { accept: 'text/plain' }
      }
    )
    expect(resp.status).toBe(200)
  })

  it('does not resend with credentials if the www-authenticate header is missing', async () => {
    expect.assertions(1)
    await saveSession(window.localStorage)(fakeSession)

    nock('https://third-party.com')
      .get('/protected-resource')
      .reply(401)

    const resp = await instance.fetch(
      'https://third-party.com/protected-resource'
    )
    expect(resp.status).toBe(401)
  })

  it('does not resend with credentials if the www-authenticate header suggests an unknown scheme', async () => {
    await saveSession(window.localStorage)(fakeSession)

    nock('https://third-party.com')
      .get('/protected-resource')
      .reply(401, '', { 'www-authenticate': 'Basic token' })

    const resp = await instance.fetch(
      'https://third-party.com/protected-resource'
    )
    expect(resp.status).toBe(401)
  })

  it('does not resend with credentials if there is no session', async () => {
    expect.assertions(1)
    nock('https://third-party.com')
      .get('/protected-resource')
      .reply(401, '', { 'www-authenticate': 'Bearer scope="openid webid"' })

    const resp = await instance.fetch(
      'https://third-party.com/protected-resource'
    )
    expect(resp.status).toBe(401)
  })

  it('does not resend with credentials if the requested resource is public', async () => {
    expect.assertions(2)
    nock('https://third-party.com')
      .get('/public-resource')
      .reply(200, 'public content', { 'content-type': 'text/plain' })

    const resp = await instance.fetch('https://third-party.com/public-resource')
    expect(resp.status).toBe(200)
    const body = await resp.text()
    expect(body).toEqual('public content')
  })

  it('does not resend with credentials if the requested resources uses plain OIDC', async () => {
    expect.assertions(1)
    nock('https://third-party.com')
      .get('/protected-resource')
      .reply(401, '', { 'www-authenticate': 'Bearer scope="openid"' })

    const resp = await instance.fetch(
      'https://third-party.com/protected-resource'
    )
    expect(resp.status).toBe(401)
  })

  describe('familiar domains with WebID-OIDC', () => {
    it('just sends one request when the RP is also the IDP', async () => {
      expect.assertions(1)
      await saveSession(window.localStorage)(fakeSession)

      nock('https://localhost')
        .get('/resource')
        .matchHeader('authorization', matchAuthzHeader('https://localhost'))
        .reply(200)

      const resp = await instance.fetch('https://localhost/resource')
      expect(resp.status).toBe(200)
    })

    it('just sends one request to domains it has already encountered', async () => {
      expect.assertions(1)
      await saveSession(window.localStorage)(fakeSession)

      await saveHost(window.localStorage)({
        url: 'third-party.com',
        requiresAuth: true
      })

      nock('https://third-party.com')
        .get('/resource')
        .matchHeader(
          'authorization',
          matchAuthzHeader('https://third-party.com')
        )
        .reply(200)

      const resp = await instance.fetch('https://third-party.com/resource')
      expect(resp.status).toBe(200)
    })
  })
})
