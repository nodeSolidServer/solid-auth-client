// @flow
/* global fetch, RequestInfo, Response */
import 'isomorphic-fetch'
import * as authorization from 'auth-header'
import RelyingParty from '@trust/oidc-rp'
import PoPToken from '@trust/oidc-rp/lib/PoPToken'

import type { loginOptions } from './api'
import { currentUrl, navigateTo } from './url-util'
import type { webIdOidcSession } from './session'
import type { AsyncStorage } from './storage'
import { defaultStorage, getData, updateStorage } from './storage'

export const login = async (
  idp: string,
  options: loginOptions
): Promise<?null> => {
  try {
    const rp = await getRegisteredRp(idp, options)
    await saveAppHashFragment(options.storage)
    return sendAuthRequest(rp, options)
  } catch (err) {
    console.warn('Error logging in with WebID-OIDC')
    console.error(err)
    return null
  }
}

export const currentSession = async (
  storage: AsyncStorage = defaultStorage()
): Promise<?webIdOidcSession> => {
  try {
    const rp = await getStoredRp(storage)
    if (!rp) {
      return null
    }
    const url = currentUrl()
    if (!url || !url.includes('#')) {
      return null
    }
    const storeData = await getData(storage)
    const resp = await rp.validateResponse(url, storeData)
    if (!resp) {
      return null
    }
    await restoreAppHashFragment(storage)
    const { idp, idToken, accessToken, clientId, sessionKey } = resp
    return {
      webId: resp.decoded.payload.sub,
      idp,
      idToken,
      accessToken,
      clientId,
      sessionKey
    }
  } catch (err) {
    console.warn('Error finding a WebID-OIDC session')
    console.error(err)
    return null
  }
}

export const logout = (storage: AsyncStorage, idp: string): Promise<void> =>
  getStoredRp(storage)
    .then(rp => (rp ? rp.logout() : undefined))
    .then(x => {
      fetch(idp + '/logout', { method: 'POST', credentials: 'include' })
    })
    .catch(err => {
      console.warn('Error logging out of the WebID-OIDC session')
      console.error(err)
    })

export const getRegisteredRp = (
  idp: string,
  options: loginOptions
): Promise<RelyingParty> =>
  getStoredRp(options.storage).then(rp => {
    if (rp && rp.provider.url === idp) {
      return rp
    }
    return registerRp(idp, options).then(rp =>
      storeRp(options.storage, idp, rp)
    )
  })

async function getStoredRp(storage: AsyncStorage): Promise<?RelyingParty> {
  const data = await getData(storage)
  const { rpConfig } = data
  if (rpConfig) {
    rpConfig.store = storage
    return RelyingParty.from(rpConfig)
  } else {
    return null
  }
}

async function storeRp(
  storage: AsyncStorage,
  idp: string,
  rp: RelyingParty
): Promise<RelyingParty> {
  await updateStorage(storage, data => ({
    ...data,
    rpConfig: rp
  }))
  return rp
}

const registerRp = (
  idp: string,
  { storage, callbackUri }: loginOptions
): Promise<RelyingParty> => {
  const responseType = 'id_token token'
  const registration = {
    issuer: idp,
    grant_types: ['implicit'],
    redirect_uris: [callbackUri],
    response_types: [responseType],
    scope: 'openid profile'
  }
  const options = {
    defaults: {
      authenticate: {
        redirect_uri: callbackUri,
        response_type: responseType
      }
    },
    store: storage
  }
  return RelyingParty.register(idp, registration, options)
}

const sendAuthRequest = async (
  rp: RelyingParty,
  { callbackUri, storage }: loginOptions
): Promise<void> => {
  const data = await getData(storage)
  const url = await rp.createRequest({ redirect_uri: callbackUri }, data)
  await updateStorage(storage, () => data)
  return navigateTo(url)
}

const saveAppHashFragment = (store: AsyncStorage): Promise<any> =>
  updateStorage(store, data => ({
    ...data,
    appHashFragment: window.location.hash
  }))

const restoreAppHashFragment = (store: AsyncStorage): Promise<any> =>
  updateStorage(store, data => {
    window.location.hash = data.appHashFragment
    delete data.appHashFragment
    return data
  })

/**
 * Answers whether a HTTP response requires WebID-OIDC authentication.
 */
export const requiresAuth = (resp: Response): boolean => {
  if (resp.status !== 401) {
    return false
  }
  const wwwAuthHeader = resp.headers.get('www-authenticate')
  if (!wwwAuthHeader) {
    return false
  }
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
export const fetchWithCredentials = (session: webIdOidcSession) => async (
  url: RequestInfo,
  options?: Object
): Promise<Response> => {
  const popToken = await PoPToken.issueFor(url, session)
  const authenticatedOptions = {
    ...options,
    headers: {
      ...(options && options.headers ? options.headers : {}),
      authorization: `Bearer ${popToken}`
    }
  }
  return fetch(url, authenticatedOptions)
}
