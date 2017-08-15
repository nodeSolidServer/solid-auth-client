// @flow
/* global RequestInfo, Request, Response, URL */
import { getSession } from './session'
import type { AsyncStorage } from './storage'
import { getData, updateStorage } from './storage'
import type { Auth } from './types'
import * as WebIdOidc from './webid-oidc'
import * as WebIdTls from './webid-tls'

export type host =
  { authType: Auth
  , url: string
  }

export const hostNameFromRequestInfo = (url: RequestInfo): string => {
  const _url = url instanceof URL
    ? url
    : url instanceof Request
      ? new URL(url.url)
      : new URL(url)
  return _url.host
}

export const getHost = (storage: AsyncStorage) => async (url: RequestInfo): Promise<?host> => {
  const requestHostName = hostNameFromRequestInfo(url)
  const session = await getSession(storage)
  if (session && hostNameFromRequestInfo(session.idp) === requestHostName) {
    return { url: requestHostName, authType: session.authType }
  }
  const { hosts } = getData(storage)
  if (!hosts) {
    return null
  }
  return hosts[requestHostName] || null
}

export const saveHost = (storage: AsyncStorage) => ({ url, authType }: host): host => {
  updateStorage(storage, (data) => ({
    ...data,
    hosts: {
      ...data.hosts,
      [url]: { authType }
    }
  }))
  return { url, authType }
}

export const updateHostFromResponse = (storage: AsyncStorage) => (resp: Response): void => {
  let authType
  if (WebIdOidc.requiresAuth(resp)) {
    authType = 'WebID-OIDC'
  } else if (WebIdTls.requiresAuth(resp)) {
    authType = 'WebID-TLS'
  } else {
    authType = null
  }

  const hostName = hostNameFromRequestInfo(resp.url)
  if (authType) {
    saveHost(storage)({ url: hostName, authType })
  }
}
