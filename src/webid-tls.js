// @flow
/* global fetch */
import 'isomorphic-fetch'

import type { webIdTlsSession } from './session'

export const login = (idp: string): Promise<?webIdTlsSession> =>
  fetch(idp, { method: 'HEAD', credentials: 'include' })
    .then(resp => resp.headers.get('user'))
    .then(webId => webId ? { type: 'WebID-TLS', idp, webId } : null)
