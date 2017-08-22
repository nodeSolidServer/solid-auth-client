// @flow
/* global fetch, RequestInfo, Response */
import 'isomorphic-fetch'
import * as authorization from 'auth-header'
import RelyingParty from 'oidc-rp/src'

import type { loginOptions } from './api'
import { currentUrl, clearHashFragment, navigateTo } from './browser-util'
import type { webIdOidcSession } from './session'
import type { AsyncStorage } from './storage'
import { defaultStorage, getData, updateStorage } from './storage'

export const login = (idp: string, options: loginOptions): Promise<null|() => any> =>
  getRegisteredRp(idp, options)
    .then(rp => () => sendAuthRequest(rp, options))
    .catch(err => {
      console.warn('Error logging in with WebID-OIDC')
      console.error(err)
      return null
    })

export const currentSession = (storage: AsyncStorage = defaultStorage()): Promise<?webIdOidcSession> => {
  return getStoredRp(storage)
    .then(rp => {
      if (!rp) { return null }
      const url = currentUrl()
      if (url && url.includes('#')) {
        return rp.validateResponse(url, storage)
      }
      return null
    })
    .then(resp => {
      if (!resp) { return null }
      clearHashFragment()
      const { idp, idToken, accessToken } = resp
      return {
        authType: 'WebID-OIDC',
        webId: resp.decoded.payload.sub,
        idp,
        idToken,
        accessToken
      }
    })
    .catch(err => {
      console.warn('Error finding a WebID-OIDC session')
      console.error(err)
      return null
    })
}

export const logout = (storage: AsyncStorage): Promise<void> =>
  getStoredRp(storage)
    .then(rp => rp ? rp.logout() : undefined)
    .catch(err => {
      console.warn('Error logging out of the WebID-OIDC session')
      console.error(err)
    })

export const getRegisteredRp = (idp: string, options: loginOptions): Promise<RelyingParty> =>
  getStoredRp(options.storage)
    .then(rp => {
      if (rp && rp.provider.url === idp) { return rp }
      return registerRp(idp, options)
        .then(rp => storeRp(options.storage, idp, rp))
    })

async function getStoredRp (storage: AsyncStorage): Promise<?RelyingParty> {
  const data = await getData(storage)
  const { rpConfig } = data
  if (rpConfig) {
    rpConfig.store = storage
    return RelyingParty.from(rpConfig)
  } else {
    return null
  }
}

async function storeRp (storage: AsyncStorage, idp: string, rp: RelyingParty): Promise<RelyingParty> {
  await updateStorage(storage, data => ({
    ...data,
    rpConfig: rp
  }))
  return rp
}

const registerRp = (idp: string, { storage, redirectUri }: loginOptions): Promise<RelyingParty> => {
  const responseType = 'id_token token'
  const registration = {
    issuer: idp,
    grant_types: [ 'implicit' ],
    redirect_uris: [ redirectUri ],
    response_types: [ responseType ],
    scope: 'openid profile'
  }
  const options = {
    defaults: {
      authenticate: {
        redirect_uri: redirectUri,
        response_type: responseType
      }
    },
    store: storage
  }
  return RelyingParty.register(idp, registration, options)
}

const sendAuthRequest = (rp: RelyingParty, { redirectUri, storage }: loginOptions): Promise<void> =>
  rp.createRequest({ redirect_uri: redirectUri }, storage)
    .then(navigateTo)

/**
 * Answers whether a HTTP response requires WebID-OIDC authentication.
 */
export const requiresAuth = (resp: Response): boolean => {
  if (resp.status !== 401) { return false }
  const wwwAuthHeader = resp.headers.get('www-authenticate')
  if (!wwwAuthHeader) { return false }
  const auth = authorization.parse(wwwAuthHeader)
  return (
    auth.scheme === 'Bearer' &&
    auth.params &&
    auth.params.scope === 'openid webid'
  )
}

/**
 * Fetches a resource, providing the WebID-OIDC ID Token as authentication.
 * Assumes that the resource has requested those tokens in a previous response.
 */
export const fetchWithCredentials = (session: webIdOidcSession) => (url: RequestInfo, options?: Object): Promise<Response> => {
  const authenticatedOptions = {
    ...options,
    headers: {
      ...(options && options.headers ? options.headers : {}),
      authorization: `Bearer ${session.idToken}`
    }
  }
  return fetch(url, authenticatedOptions)
}
