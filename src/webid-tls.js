// @flow
/* global fetch, Response */
import 'isomorphic-fetch'

import * as authorization from 'auth-header'
import type { webIdTlsSession } from './session'

export const login = async (idp: string): Promise<?webIdTlsSession> => {
  const resp = await fetch(idp, { method: 'HEAD', credentials: 'include' })
  const webId = resp.headers.get('user')
  return webId ? { authType: 'WebID-TLS', idp, webId } : null
}

export const requiresAuth = (resp: Response): boolean => {
  if (resp.status !== 401) { return false }
  const wwwAuthHeader = resp.headers.get('www-authenticate')
  if (!wwwAuthHeader) { return false }
  const auth = authorization.parse(wwwAuthHeader)
  return auth.scheme === 'WebID-TLS'
}
