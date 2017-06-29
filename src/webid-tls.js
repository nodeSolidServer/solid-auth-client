// @flow
/* global fetch */
import 'isomorphic-fetch'

import type { session } from './session'

export const login = (idp: string): Promise<?session> =>
  fetch(idp, { method: 'HEAD', credentials: 'include' })
    .then(resp => resp.headers.get('user'))
    .then(webId => webId ? { idp, webId } : null)
