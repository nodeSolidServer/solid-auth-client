// @flow
/* global RequestInfo, Response */
import { authnFetch } from './authn-fetch'
import type { session } from './session'
import { getSession, saveSession, clearSession } from './session'
import type { Storage } from './storage'
import { defaultStorage } from './storage'
import { currentUrlNoParams } from './util'
import * as WebIdTls from './webid-tls'
import * as WebIdOidc from './webid-oidc'

export type authResponse =
  { session: ?session
  , fetch: (url: RequestInfo, options?: Object) => Promise<Response>
  }

export type loginOptions = {
  redirectUri: ?string,
  storage: Storage
}

const defaultLoginOptions = (): loginOptions => {
  const url = currentUrlNoParams()
  return {
    redirectUri: url ? url.split('#')[0] : null,
    storage: defaultStorage()
  }
}

export const login = (idp: string, options: loginOptions): Promise<authResponse> => {
  options = { ...defaultLoginOptions(), ...options }
  return WebIdTls.login(idp)
    .then(session => session ? saveSession(options.storage, session) : null)
    .then(session => session
      ? { session, fetch: authnFetch(options.storage) }
      : WebIdOidc.login(idp, options)
    )
}

export const currentSession = (storage: Storage = defaultStorage()): Promise<authResponse> => {
  const session = getSession(storage)
  if (session) {
    return Promise.resolve({ session, fetch: authnFetch(storage) })
  }
  return WebIdOidc.currentSession(storage)
    .then(session => session ? saveSession(storage, session) : session)
    .then(session => ({ session, fetch: authnFetch(storage) }))
}

export const logout = (storage: Storage = defaultStorage()): Promise<void> =>
  Promise.resolve(getSession(storage))
    .then(session => session && session.idToken && session.accessToken
      ? WebIdOidc.logout(storage)
      : null
    )
    .then(() => clearSession(storage))

export const fetch: (url: RequestInfo, options?: Object) => Promise<Response> =
  authnFetch(defaultStorage())
