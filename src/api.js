// @flow
/* global RequestInfo, Response */
import { authnFetch } from './authn-fetch'
import { openIdpSelector, startPopupServer } from './popup'
import type { Session } from './session'
import { getSession, saveSession, clearSession } from './session'
import type { AsyncStorage } from './storage'
import { defaultStorage } from './storage'
import { currentUrlNoParams } from './url-util'
import * as WebIdOidc from './webid-oidc'

export type loginOptions = {
  callbackUri: ?string,
  popupUri: ?string,
  storage: AsyncStorage
}

const defaultLoginOptions = (): loginOptions => {
  const url = currentUrlNoParams()
  return {
    callbackUri: url ? url.split('#')[0] : null,
    popupUri: null,
    storage: defaultStorage()
  }
}

export const fetch = (url: RequestInfo, options?: Object): Promise<Response> =>
  authnFetch(defaultStorage())(url, options)

async function firstSession(
  storage: AsyncStorage,
  authFns: Array<() => Promise<?Session>>
): Promise<?Session> {
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

export async function login(
  idp: string,
  options: loginOptions
): Promise<?Session> {
  options = { ...defaultLoginOptions(), ...options }
  const webIdOidcLogin = await WebIdOidc.login(idp, options)
  return webIdOidcLogin
}

export async function popupLogin(options: loginOptions): Promise<?Session> {
  if (!options.popupUri) {
    throw new Error('Must provide options.popupUri')
  }
  if (!options.callbackUri) {
    options.callbackUri = options.popupUri
  }
  options = { ...defaultLoginOptions(), ...options }
  const childWindow = openIdpSelector(options)
  const session = await startPopupServer(options.storage, childWindow, options)
  return session
}

export async function currentSession(
  storage: AsyncStorage = defaultStorage()
): Promise<?Session> {
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
  if (session) {
    try {
      await WebIdOidc.logout(storage)
    } catch (err) {
      console.warn('Error logging out:')
      console.error(err)
    }
    await clearSession(storage)
  }
}
