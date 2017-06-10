// @flow
import 'isomorphic-fetch'

import type { Storage } from './storage'
import { memStorage, defaultStorage } from './storage'

import { currentUrl } from './util'
import * as WebIdTls from './webid-tls'
import * as WebIdOidc from './webid-oidc'

type fetchApi = (url: string, options: Object) => any

export type authResponse =
  { webId: ?string
  , fetch: fetchApi
  }

export type loginOptions = {
  redirectUri: ?string,
  storage: Storage
}

const defaultLoginOptions = (): loginOptions => ({
  redirectUri: currentUrl(),
  storage: defaultStorage()
})

// TODO: manage storage here, not in the OIDC module

export const login = (idp: string, options: loginOptions): Promise<authResponse> => {
  options = { ...defaultLoginOptions(), ...options }
  return WebIdTls.login(idp)
    .then(webId => webId
      ? { webId, fetch }
      : WebIdOidc.login(idp, options)
    )
}

export const currentUser = (idp: string, options: { storage: Storage } = { storage: defaultStorage() }): Promise<authResponse> =>
  WebIdTls.login(idp)
    .then(webId => webId
      ? { webId, fetch }
      : WebIdOidc.currentUser(idp, options)
    )
