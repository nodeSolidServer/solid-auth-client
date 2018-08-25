// @flow
/* global fetch, RequestInfo, Response */
import 'isomorphic-fetch'

import { toUrlString } from './url-util'
import { getHost, updateHostFromResponse } from './host'
import type { Session } from './session'
import { getSession } from './session'
import type { AsyncStorage } from './storage'
import * as WebIdOidc from './webid-oidc'

// Store the global fetch, so the user can safely override it
const globalFetch = fetch

export function authnFetch(
  storage: AsyncStorage
): (RequestInfo, ?Object) => Promise<Response> {
  return async (input, options) => {
    options = options || {}
    const session = await getSession(storage)
    const shouldShareCreds = await shouldShareCredentials(storage)(input)
    if (session && shouldShareCreds) {
      return fetchWithCredentials(session, input, options)
    }
    const resp = await globalFetch(input, options)
    if (resp.status === 401) {
      await updateHostFromResponse(storage)(resp)
      const shouldShareCreds = await shouldShareCredentials(storage)(input)
      if (session && shouldShareCreds) {
        return fetchWithCredentials(session, input, options)
      }
    }
    return resp
  }
}

function shouldShareCredentials(
  storage: AsyncStorage
): (input: RequestInfo) => Promise<boolean> {
  return async input => {
    const session = await getSession(storage)
    if (!session) {
      return false
    }
    const requestHost = await getHost(storage)(toUrlString(input))
    return requestHost != null && requestHost.requiresAuth
  }
}

const fetchWithCredentials = async (
  session: Session,
  input: RequestInfo,
  options?: Object
): Promise<Response> => {
  return WebIdOidc.fetchWithCredentials(session)(globalFetch, input, options)
}
