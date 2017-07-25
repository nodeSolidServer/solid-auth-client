// @flow
/* global fetch, RequestInfo, Response */
import 'isomorphic-fetch'

import { getSession } from './session'
import type { Storage } from './storage'
import * as WebIdOidc from './webid-oidc'

export const authnFetch = (storage: Storage) => (url: RequestInfo, options?: Object): Promise<Response> =>
  fetch(url, options)
    .then(resp => {
      if (WebIdOidc.requiresAuth(resp)) {
        const session = getSession(storage)
        if (session && session.type === 'WebID-OIDC') {
          return WebIdOidc.fetchWithCredentials(session)(url, options)
        }
      }
      return resp
    })
