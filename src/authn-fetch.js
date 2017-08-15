// @flow
/* global fetch, RequestInfo, Response */
import 'isomorphic-fetch'

import { getHost, updateHostFromResponse } from './hosts'
import type { session } from './session'
import { getSession } from './session'
import type { AsyncStorage } from './storage'
import * as WebIdOidc from './webid-oidc'

export const authnFetch = (storage: AsyncStorage) => async (url: RequestInfo, options?: Object): Promise<Response> => {
  const session = await getSession(storage)
  if (session && await shouldShareCredentials(storage)(url)) {
    return fetchWithCredentials(session, url, options)
  }
  return fetch(url, options)
    .then(async (resp) => {
      if (resp.status === 401) {
        updateHostFromResponse(storage)(resp)
        if (session && await shouldShareCredentials(storage)(url)) {
          return fetchWithCredentials(session, url, options)
        }
      }
      return resp
    })
}

const shouldShareCredentials = (storage: AsyncStorage) => async (url: RequestInfo): Promise<boolean> => {
  const session = await getSession(storage)
  if (!session) {
    return false
  }
  const requestHost = await getHost(storage)(url)
  return requestHost != null &&
    session.authType === requestHost.authType
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
