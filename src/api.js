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
  if (!/https?:/.test(options.popupUri)) {
    options.popupUri = new URL(
      options.popupUri || '',
      window.location
    ).toString()
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
  let session = await getSession(storage)
  if (!session) {
    try {
      session = await WebIdOidc.currentSession(storage)
    } catch (err) {
      console.error(err)
    }
    if (session) {
      await saveSession(storage)(session)
    }
  }
  return session
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
