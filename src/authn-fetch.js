// @flow
/* global fetch, RequestInfo, Response */
import 'isomorphic-fetch'

import { getHost, updateHostFromResponse } from './host'
import type { session } from './session'
import { getSession } from './session'
import type { AsyncStorage } from './storage'
import * as WebIdOidc from './webid-oidc'

export function authnFetch (storage: AsyncStorage): (RequestInfo, ?Object) => Promise<Response> {
  return async (url, options) => {
    options = options || {}
    const session = await getSession(storage)
    const shouldShareCreds = await shouldShareCredentials(storage)(url)
    if (session && shouldShareCreds) {
      return fetchWithCredentials(session, url, options)
    }
    const resp = await fetch(url, options)
    if (resp.status === 401) {
      await updateHostFromResponse(storage)(resp)
      const shouldShareCreds = await shouldShareCredentials(storage)(url)
      if (session && shouldShareCreds) {
        return fetchWithCredentials(session, url, options)
      }
    }
    return resp
  }
}

function shouldShareCredentials (storage: AsyncStorage): (url: RequestInfo) => Promise<boolean> {
  return async (url) => {
    const session = await getSession(storage)
    if (!session) {
      return false
    }
    const requestHost = await getHost(storage)(url)
    return requestHost != null &&
      session.authType === requestHost.authType
  }
}

const fetchWithCredentials = (session: session, url: RequestInfo, options?: Object): Promise<Response> => {
  switch (session.authType) {
    case 'WebID-OIDC':
      return WebIdOidc.fetchWithCredentials(session)(url, options)
    case 'WebID-TLS':
    default:
      return fetch(url, options)
  }
}
