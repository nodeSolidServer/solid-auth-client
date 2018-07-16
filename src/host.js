// @flow
/* global RequestInfo, Request, Response, URL */
import { getSession } from './session'
import type { AsyncStorage } from './storage'
import { getData, updateStorage } from './storage'
import * as WebIdOidc from './webid-oidc'

export type host = {
  url: string,
  requiresAuth: boolean
}

export const hostNameFromRequestInfo = (url: RequestInfo): string => {
  const _url =
    url instanceof URL
      ? url
      : url instanceof Request
        ? new URL(url.url)
        : new URL(url)
  return _url.host
}

export function getHost(storage: AsyncStorage): RequestInfo => Promise<?host> {
  return async url => {
    const requestHostName = hostNameFromRequestInfo(url)
    const session = await getSession(storage)
    if (session && hostNameFromRequestInfo(session.idp) === requestHostName) {
      return { url: requestHostName, requiresAuth: true }
    }
    const { hosts } = await getData(storage)
    if (!hosts) {
      return null
    }
    return hosts[requestHostName] || null
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
      const hostName = hostNameFromRequestInfo(resp.url)
      await saveHost(storage)({ url: hostName, requiresAuth: true })
    }
  }
}
