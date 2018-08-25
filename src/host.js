// @flow
/* globalRequest, Response, URL */
import { getSession } from './session'
import type { AsyncStorage } from './storage'
import { getData, updateStorage } from './storage'
import * as WebIdOidc from './webid-oidc'

export type host = {
  url: string,
  requiresAuth: boolean
}

export function getHost(storage: AsyncStorage): string => Promise<?host> {
  return async url => {
    const { host } = new URL(url)
    const session = await getSession(storage)
    if (session && host === new URL(session.idp).host) {
      return { url: host, requiresAuth: true }
    }
    const { hosts } = await getData(storage)
    return hosts && hosts[host]
  }
}

export function saveHost(storage: AsyncStorage): host => Promise<void> {
  return async ({ url, requiresAuth }) => {
    await updateStorage(storage, data => ({
      ...data,
      hosts: {
        ...data.hosts,
        [url]: { requiresAuth }
      }
    }))
  }
}

export function updateHostFromResponse(
  storage: AsyncStorage
): Response => Promise<void> {
  return async resp => {
    if (WebIdOidc.requiresAuth(resp)) {
      const { host } = new URL(resp.url)
      await saveHost(storage)({ url: host, requiresAuth: true })
    }
  }
}
