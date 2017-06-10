// @flow
import type { Storage } from './storage'
import { getData, updateStorage } from './storage'

export type session =
  { idp: string
  , webId: string
  , accessToken?: string
  , idToken?: string
  }

export const getSession = (storage: Storage, idp: string): ?session => {
  const { session } = getData(storage)
  return session && session.idp === idp
    ? session
    : null
}

export const saveSession = (storage: Storage, session: session): session =>
  updateStorage(storage, data => ({ ...data, session })).session

export const clearSession = (storage: Storage, idp: string): void => {
  updateStorage(storage, data => ({ ...data, session: null }))
}
