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

export async function getSession (storage: AsyncStorage): Promise<?session> {
  const data = await getData(storage)
  return data.session || null
}

export function saveSession (storage: AsyncStorage): (session: session) => Promise<session> {
  return async (session) => {
    const data = await updateStorage(storage, data => ({ ...data, session }))
    return data.session
  }
}

export async function clearSession (storage: AsyncStorage): Promise<void> {
  await updateStorage(storage, data => ({ ...data, session: null }))
}
