// @flow
/* global fetch, RequestInfo, Response */
import 'isomorphic-fetch'
import * as authorization from 'auth-header'

import { getSession } from './session'
import type { Storage } from './storage'

export const authnFetch = (storage: Storage): (url: RequestInfo, options?: Object) => Promise<Response> =>
  (url: RequestInfo, options?: Object) =>
    fetch(url, options)
      .then(resp => {
        if (resp.status === 401 && requiresWebIdOidc(resp.headers.get('www-authenticate'))) {
          const session = getSession(storage)
          if (session && session.accessToken) {
            const retryOptions = {
              ...options,
              headers: {
                ...(options && options.headers ? options.headers : {}),
                authorization: `Bearer ${session.accessToken}`
              }
            }
            return fetch(url, retryOptions)
          }
        }
        return resp
      })

const requiresWebIdOidc = (wwwAuthHeader: ?string): boolean => {
  if (!wwwAuthHeader) { return false }
  const auth = authorization.parse(wwwAuthHeader)
  return (auth.scheme === 'Bearer') &&
    auth.params && auth.params.scope === 'openid'
}
