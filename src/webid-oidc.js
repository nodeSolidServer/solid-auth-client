// @flow
/* global fetch, RequestInfo, Response */
import 'isomorphic-fetch'
import * as authorization from 'auth-header'
import RelyingParty from '@trust/oidc-rp'
import PoPToken from '@trust/oidc-rp/lib/PoPToken'

import type { loginOptions } from './api'
import { currentUrl, clearHashFragment, navigateTo } from './browser-util'
import type { webIdOidcSession } from './session'
import type { Storage } from './storage'
import { defaultStorage, getData, updateStorage } from './storage'

export const login = (idp: string, options: loginOptions): Promise<any> =>
  getRegisteredRp(idp, options)
    .then(rp => sendAuthRequest(rp, options))
    .catch(err => {
      console.warn('Error logging in with WebID-OIDC')
      console.error(err)
      return null
    })

export const currentSession = (storage: Storage = defaultStorage()): Promise<?webIdOidcSession> => {
  return getStoredRp(storage)
    .then(rp => {
      if (!rp) { return null }
      return rp.validateResponse(currentUrl() || '', storage)
    })
    .then(resp => {
      if (!resp) { return null }
      clearHashFragment()
      return {
        authType: 'WebID-OIDC',
        idp: resp.idp,
        webId: resp.decoded.payload.sub,
        idToken: resp.idToken,
        accessToken: resp.accessToken,
        clientId: resp.clientId,
        sessionKey: resp.sessionKey
      }
    })
    .catch(err => {
      console.warn('Error finding a WebID-OIDC session')
      console.error(err)
      return null
    })
}

export const logout = (storage: Storage): Promise<void> =>
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

const getStoredRp = (storage: Storage): Promise<?RelyingParty> => {
  const { rpConfig } = getData(storage)
  return rpConfig ? RelyingParty.from(rpConfig) : Promise.resolve(null)
}

const storeRp = (storage: Storage, idp: string, rp: RelyingParty): RelyingParty => {
  updateStorage(storage, data => ({
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
 *
 * TODO: WebID-OIDC needs additional metadata to distinguish itself from plain
 * OIDC.
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
  return PoPToken.issueFor(url, session)
    .then(popToken => {
      const authenticatedOptions = {
        ...options,
        headers: {
          ...(options && options.headers ? options.headers : {}),
          authorization: `Bearer ${popToken}`
        }
      }
      return fetch(url, authenticatedOptions)
    })
}
