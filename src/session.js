// @flow

import type { AsyncStorage } from './storage'
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
  storage.getData().session || null

export const saveSession = (storage: AsyncStorage) => async (session: session): Promise<session> =>
  storage.update(data => ({ ...data, session })).session

export const clearSession = async (storage: AsyncStorage): Promise<void> => {
  storage.update(data => ({ ...data, session: null }))
}
