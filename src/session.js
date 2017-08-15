// @flow

import type { AsyncStorage } from './storage'
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

export const getSession = async (storage: AsyncStorage): Promise<?session> =>
  getData(storage).session || null

export const saveSession = (storage: AsyncStorage) => async (session: session): Promise<session> =>
  updateStorage(storage, data => ({ ...data, session })).session

export const clearSession = async (storage: AsyncStorage): Promise<void> => {
  updateStorage(storage, data => ({ ...data, session: null }))
}
