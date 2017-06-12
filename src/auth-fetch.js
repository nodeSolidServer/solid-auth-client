// @flow
/* global fetch, RequestInfo, Response */
import 'isomorphic-fetch'
import * as authorization from 'auth-header'

import type { session } from './session'

export const authenticatedFetch = (session: ?session): (url: RequestInfo, options?: Object) => Promise<Response> =>
  (url: RequestInfo, options?: Object) =>
    fetch(url, options)
      .then(resp => {
        if (resp.status === 401 && requiresWebIdOidc(resp.headers.get('www-authenticate'))) {
          if (session && session.accessToken) {
            options = options || { headers: {} }
            options.headers.authorization = `Bearer ${session.accessToken}`
            return fetch(url, options)
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
