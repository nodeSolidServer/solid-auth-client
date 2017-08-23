// @flow
/* global RequestInfo, Response */
import { authnFetch } from './authn-fetch'
import { openIdpSelector, startPopupServer } from './popup'
import type { session } from './session'
import { getSession, saveSession, clearSession } from './session'
import type { AsyncStorage } from './storage'
import { defaultStorage } from './storage'
import { currentUrlNoParams, originOf } from './url-util'
import * as WebIdTls from './webid-tls'
import * as WebIdOidc from './webid-oidc'

export type loginOptions = {
  redirectUri: ?string,
  idpSelectUri: ?string,
  storage: AsyncStorage
}

const defaultLoginOptions = (): loginOptions => {
  const url = currentUrlNoParams()
  return {
    redirectUri: url ? url.split('#')[0] : null,
    idpSelectUri: null,
    storage: defaultStorage()
  }
}

export const fetch = (url: RequestInfo, options?: Object): Promise<Response> =>
  authnFetch(defaultStorage())(url, options)

async function firstSession(
  storage: AsyncStorage,
  authFns: Array<() => Promise<?session>>
): Promise<?session> {
  if (authFns.length === 0) {
    return null
  }
  try {
    const session = await authFns[0]()
    if (session) {
      return saveSession(storage)(session)
    }
  } catch (err) {
    console.error(err)
  }
  return firstSession(storage, authFns.slice(1))
}

type redirectFn = () => any

export async function login(
  idp: string,
  options: loginOptions
): Promise<?session | ?redirectFn> {
  options = { ...defaultLoginOptions(), ...options }
  const webIdTlsSession = await WebIdTls.login(idp)
  if (webIdTlsSession) {
    return saveSession(options.storage)(webIdTlsSession)
  }
  const webIdOidcLoginRedirectFn = await WebIdOidc.login(idp, options)
  return webIdOidcLoginRedirectFn
}

export async function popupLogin(options: loginOptions): Promise<?session> {
  options = { ...defaultLoginOptions(), ...options }
  if (!options.idpSelectUri) {
    throw new Error('Must provide options.idpSelectUri')
  }
  const { storage, idpSelectUri } = options
  const childWindow = openIdpSelector(options)
  const childOrigin = originOf(idpSelectUri)
  const session = await startPopupServer(storage, childWindow, options)
  return session
}

export async function currentSession(
  storage: AsyncStorage = defaultStorage()
): Promise<?session> {
  const session = await getSession(storage)
  if (session) {
    return session
  }
  return firstSession(storage, [WebIdOidc.currentSession.bind(null, storage)])
}

export async function logout(
  storage: AsyncStorage = defaultStorage()
): Promise<void> {
  const session = await getSession(storage)
  if (!session) {
    return
  }
  switch (session.authType) {
    case 'WebID-OIDC':
      try {
        await WebIdOidc.logout(storage)
      } catch (err) {
        console.warn('Error logging out:')
        console.error(err)
      }
    case 'WebID-TLS':
    default:
      return clearSession(storage)
  }
}
