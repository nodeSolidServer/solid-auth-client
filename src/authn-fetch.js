// @flow
import 'isomorphic-fetch'

import { toUrlString } from './url-util'
import { getHost, updateHostFromResponse } from './host'
import { getSession } from './session'
import type { AsyncStorage } from './storage'
import { fetchWithCredentials } from './webid-oidc'

export async function authnFetch(
  storage: AsyncStorage,
  fetch: Function,
  input: RequestInfo,
  options?: RequestOptions
): Promise<Response> {
  // If not authenticated, perform a regular fetch
  const session = await getSession(storage)
  if (!session) {
    return fetch(input, options)
  }

  // If we know the server expects credentials, send them
  if (await shouldShareCredentials(storage, input)) {
    return fetchWithCredentials(session, fetch, input, options)
  }

  // If we don't know for sure, try a regular fetch first
  let resp = await fetch(input, options)

  // If the server then requests credentials, send them
  if (resp.status === 401) {
    await updateHostFromResponse(storage)(resp)
    if (await shouldShareCredentials(storage, input)) {
      resp = fetchWithCredentials(session, fetch, input, options)
    }
  }
  return resp
}

async function shouldShareCredentials(
  storage: AsyncStorage,
  input: RequestInfo
): Promise<boolean> {
  const requestHost = await getHost(storage)(toUrlString(input))
  return requestHost != null && requestHost.requiresAuth
}
