// @flow
/* global Response */
import * as authorization from 'auth-header'

import RelyingParty from '@solid/oidc-rp'
import PoPToken from '@solid/oidc-rp/src/PoPToken'

import type { loginOptions } from './solid-auth-client'
import { currentUrl, navigateTo, toUrlString } from './url-util'
import type { webIdOidcSession } from './session'
import type { AsyncStorage } from './storage'
import { defaultStorage, getData, updateStorage } from './storage'

export async function login(
  idp: string,
  options: loginOptions
): Promise<?null> {
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

export async function currentSession(
  storage: AsyncStorage = defaultStorage()
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
    const storeData = await getData(storage)
    const session = await rp.validateResponse(url, storeData)
    if (!session) {
      return null
    }
    return {
      ...session,
      webId: session.idClaims.sub,
      idp: session.issuer,
    }
  } catch (err) {
    console.warn('Error finding a WebID-OIDC session')
    console.error(err)
    return null
  }
}

export async function logout(
  storage: AsyncStorage,
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
        // But tell users it is harmless because they will see the GET failure in the console
        console.info(
          "Couldn't find /.well-known/solid/logout, this is harmless."
        )
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
  await updateStorage(storage, (data) => ({
    ...data,
    rpConfig: rp,
  }))
  return rp
}

function registerRp(idp: string, opts: loginOptions): Promise<RelyingParty> {
  const { storage, callbackUri } = opts
  const responseType = 'id_token token'

  const clientNameI18n = {}
  Object.entries(opts)
    .filter(([key, _]) => key.startsWith('clientName#'))
    .forEach(
      ([key, value]) =>
        (clientNameI18n[key.replace('clientName#', 'client_name#')] = value)
    )

  const supplementaryOptions = {
    logo_uri: opts.logoUri,
    contacts: opts.contacts,
    client_name: opts.clientName,
  }

  const registration = {
    issuer: idp,
    grant_types: ['implicit'],
    redirect_uris: [callbackUri],
    response_types: [responseType],
    scope: 'openid profile',
    ...clientNameI18n,
    ...supplementaryOptions,
  }

  // Note that overrides @solid/oidc-rp/RelyingParty defaults (i.e. not merged)
  const options = {
    defaults: {
      authenticate: {
        redirect_uri: callbackUri,
        response_type: responseType,
        display: 'page',
        scope: ['openid'],
      },
    },
    store: storage,
  }

  return RelyingParty.register(idp, registration, options)
}

async function sendAuthRequest(
  rp: RelyingParty,
  { callbackUri, storage }: loginOptions
): Promise<void> {
  const data = await getData(storage)
  const url = await rp.createRequest({ redirect_uri: callbackUri }, data)
  await updateStorage(storage, () => data)
  return navigateTo(url)
}

async function saveAppHashFragment(store: AsyncStorage): Promise<void> {
  await updateStorage(store, (data) => ({
    ...data,
    appHashFragment: window.location.hash,
  }))
}

async function restoreAppHashFragment(store: AsyncStorage): Promise<void> {
  await updateStorage(store, ({ appHashFragment = '', ...data }) => {
    window.location.hash = appHashFragment
    return data
  })
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
  input: any,
  options?: RequestOptions
): Promise<Response> {
  // Add Authorization header (assuming a modifiable headers object)
  const headers: any = (options ? options.headers : input.headers) || {}
  const popToken = await PoPToken.issueFor(toUrlString(input), session)
  headers.authorization = `Bearer ${popToken}`
  return fetch(input, { ...options, credentials: 'include', headers })
}
