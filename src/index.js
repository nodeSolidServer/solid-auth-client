// @flow
import 'isomorphic-fetch'

import type { session } from './session'
import { getSession, saveSession, clearSession } from './session'
import type { Storage } from './storage'
import { memStorage, defaultStorage } from './storage'
import { currentUrl } from './util'
import * as WebIdTls from './webid-tls'
import * as WebIdOidc from './webid-oidc'

type fetchApi = (url: string, options: Object) => any

export type authResponse =
  { session: ?session
  , fetch: fetchApi
  }

export type loginOptions = {
  redirectUri: ?string,
  storage: Storage
}

const defaultLoginOptions = (): loginOptions => ({
  redirectUri: currentUrl(),
  storage: defaultStorage()
})

export const login = (idp: string, options: loginOptions): Promise<authResponse> => {
  options = { ...defaultLoginOptions(), ...options }
  return WebIdTls.login(idp)
    .then(session => session ? saveSession(options.storage, session) : null)
    .then(session => session ? { session, fetch } : WebIdOidc.login(idp, options))
}

export const currentUser = (idp: string, options: { storage: Storage } = { storage: defaultStorage() }): Promise<authResponse> => {
  const session = getSession(options.storage, idp)
  if (session) {
    return Promise.resolve({ session, fetch })
  }
  return WebIdTls.login(idp)
    .then(session => session || WebIdOidc.currentUser(idp, options))
    .then(session => session ? saveSession(options.storage, session) : session)
    .then(session => ({ session, fetch }))
}

export const logout = (idp: string, options: { storage: Storage } = { storage: defaultStorage() }): Promise<void> =>
  Promise.resolve(getSession(options.storage, idp))
    .then(session => session && session.idToken && session.accessToken
      ? WebIdOidc.logout(idp, options)
      : null
    )
    .then(() => clearSession(options.storage, idp))
