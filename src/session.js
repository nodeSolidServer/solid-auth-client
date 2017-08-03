// @flow

import type { Storage } from './storage'
import { getData, updateStorage } from './storage'
import type { WebIdTls, WebIdOidc } from './types'

export type webIdTlsSession =
  { authType: WebIdTls
  , idp: string
  , webId: string
  }

export type webIdOidcSession =
  { authType: WebIdOidc
  , idp: string
  , webId: string
  , accessToken: string
  , idToken: string
  }

export type session =
  | webIdTlsSession
  | webIdOidcSession

export const getSession = (storage: Storage): ?session =>
  getData(storage).session || null

export const saveSession = (storage: Storage) => (session: session): session =>
  updateStorage(storage, data => ({ ...data, session })).session

export const clearSession = (storage: Storage): void => {
  updateStorage(storage, data => ({ ...data, session: null }))
}
