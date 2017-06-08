// @flow
import 'isomorphic-fetch'

import type { Storage } from './storage'
import { memStorage, defaultStorage } from './storage'

import * as WebIdTls from './webid-tls'
import * as WebIdOidc from './webid-oidc'

type fetchApi = (url: string, options: Object) => any

type authResponse =
  { webId: string
  , fetch: fetchApi
  }

export type loginOptions = {
  redirectUri?: string,
  storage: Storage
}

const currentUrl = () => {
  if (window && window.location) {
    return window.location.href
  } else {
    console.warn(
      `'window.location' unavailable.  ` +
      `Passing 'undefined' as the redirectUri.  ` +
      `Call 'login' with a valid URL for 'options.redirectUri'`
    )
    return undefined
  }
}

const defaultLoginOptions = (): loginOptions => ({
  redirectUri: currentUrl(),
  storage: defaultStorage()
})

export const login = (idp: string, options: loginOptions): Promise<authResponse> => {
  options = { ...defaultLoginOptions(), ...options }
  return WebIdTls.login(idp)
    .then(webId => webId
      ? { webId, fetch }
      : WebIdOidc.login(idp, options)
    )
}

export const currentUser = (idp: string, { storage }: { storage: Storage } = { storage: defaultStorage() }): Promise<authResponse> =>
  WebIdTls.login(idp)
    .then(webId => ({ webId, fetch }))
