// @flow

import type { AsyncStorage } from './storage'
import { getData, updateStorage } from './storage'

export type webIdOidcSession = {
  idp: string,
  webId: string,
  accessToken: string,
  idToken: string,
  clientId: string,
  sessionKey: string
}

export type Session = webIdOidcSession

export async function getSession(storage: AsyncStorage): Promise<?Session> {
  const data = await getData(storage)
  return data.session || null
}

export function saveSession(
  storage: AsyncStorage
): (session: Session) => Promise<Session> {
  return async session => {
    const data = await updateStorage(storage, data => ({ ...data, session }))
    return data.session
  }
}

export async function clearSession(storage: AsyncStorage): Promise<void> {
  await updateStorage(storage, data => ({ ...data, session: null }))
}
