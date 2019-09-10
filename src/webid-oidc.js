// @flow
/* global RequestInfo, Response */
import * as authorization from 'auth-header'
import RelyingParty from '@solid/oidc-rp'
import PoPToken from '@solid/oidc-rp/lib/PoPToken'

import type { loginOptions } from './solid-auth-client'
import { currentUrl, navigateTo, toUrlString } from './url-util'
import { ItemStorage } from './storage'

export type webIdOidcSession = {
  idp: string,
  webId: string,
  accessToken: string,
  idToken: string,
  clientId: string,
  sessionKey: string
}

export type Session = webIdOidcSession

export async function login(
  idp: string,
  options: loginOptions
): Promise<?null> {
  try {
    const rp = await getRegisteredRp(idp, options)
    await rp.logout()
    await saveAppHashFragment(options.storage)
    return sendAuthRequest(rp, options)
  } catch (err) {
    console.warn('Error logging in with WebID-OIDC')
    console.error(err)
    return null
  }
}

export async function currentSession(
  storage: ItemStorage
): Promise<?webIdOidcSession> {
  try {
    // Obtain the Relying Party
    const rp = await getStoredRp(storage)
    if (!rp) {
      return null
    }

    // Obtain and clear the OIDC URL fragment
    const url = currentUrl()
    if (!/#(.*&)?access_token=/.test(url)) {
      return null
    }
    window.location.hash = ''
    await restoreAppHashFragment(storage)

    // Obtain a session from the Relying Party
    const storeData = await storage.getData()
    const session = await rp.validateResponse(url, storeData)
    if (!session) {
      return null
    }
    return {
      ...session,
      webId: session.idClaims.sub,
      idp: session.issuer
    }
  } catch (err) {
    console.warn('Error finding a WebID-OIDC session')
    console.error(err)
    return null
  }
}

export async function logout(
  storage: ItemStorage,
  fetch: Function
): Promise<void> {
  const rp = await getStoredRp(storage)
  if (rp) {
    try {
      // First log out from the IDP
      await rp.logout()
      // Then, log out from the RP
      try {
        await fetch('/.well-known/solid/logout', { credentials: 'include' })
      } catch (e) {
        // Ignore errors for when we are not on a Solid pod
      }
    } catch (err) {
      console.warn('Error logging out of the WebID-OIDC session')
      console.error(err)
    }
  }
}

export async function getRegisteredRp(
  idp: string,
  options: loginOptions
): Promise<RelyingParty> {
  // To reuse a possible previous RP,
  // it be for the same IDP and redirect URI
  let rp = await getStoredRp(options.storage)
  if (
    !rp ||
    rp.provider.url !== idp ||
    !rp.registration.redirect_uris.includes(options.callbackUri)
  ) {
    // Register a new RP
    rp = await registerRp(idp, options)
    await storeRp(options.storage, idp, rp)
  }
  return rp
}

async function getStoredRp(storage: ItemStorage): Promise<?RelyingParty> {
  const rpConfig = await storage.get('rpConfig')
  if (rpConfig) {
    rpConfig.store = storage
    return RelyingParty.from(rpConfig)
  } else {
    return null
  }
}

async function storeRp(
  storage: ItemStorage,
  idp: string,
  rp: RelyingParty
): Promise<RelyingParty> {
  await storage.set('rpConfig', rp)
  return rp
}

function registerRp(
  idp: string,
  { storage, callbackUri }: loginOptions
): Promise<RelyingParty> {
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

async function sendAuthRequest(
  rp: RelyingParty,
  { callbackUri, storage }: loginOptions
): Promise<void> {
  const data = await storage.getData()
  const url = await rp.createRequest({ redirect_uri: callbackUri }, data)
  await storage.setData(data)
  return navigateTo(url)
}

async function saveAppHashFragment(store: ItemStorage): Promise<void> {
  await store.set('appHashFragment', window.location.hash)
}

async function restoreAppHashFragment(store: ItemStorage): Promise<void> {
  window.location.hash = (await store.get('appHashFragment')) || ''
  await store.remove('appHashFragment')
}

/**
 * Answers whether a HTTP response requires WebID-OIDC authentication.
 */
export function requiresAuth(resp: Response): boolean {
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
export async function fetchWithCredentials(
  session: webIdOidcSession,
  fetch: Function,
  input: RequestInfo,
  options?: RequestOptions
): Promise<Response> {
  const popToken = await PoPToken.issueFor(toUrlString(input), session)
  const authenticatedOptions = {
    ...options,
    credentials: 'include',
    headers: {
      ...(options && options.headers ? options.headers : {}),
      authorization: `Bearer ${popToken}`
    }
  }
  return fetch(input, authenticatedOptions)
}
