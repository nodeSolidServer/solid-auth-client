// @flow
import 'isomorphic-fetch'
import ClientAuthOIDC from 'solid-auth-oidc'

interface Storage {
  getItem (key: string): void;
  setItem (key: string, val: string): void;
}

type fetchApi = (url: string, options: Object) => any

type authResponse =
  { webId: string
  , fetch: fetchApi
  }

type loginOptions = {
  redirectUri?: string,
  storage: Storage
}

type currentUserOptions = {
  storage: Storage
}

export const memStorage = () => {
  const store = {}
  return {
    getItem (key: string) {
      return store[key]
    },
    setItem (key: string, val: string) {
      store[key] = val
    }
  }
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

const defaultStorage = () => {
  if (window && window.localStorage) {
    return window.localStorage
  } else {
    console.warn(
      `'window.localStorage' unavailable.  ` +
      `Passing a (not very useful) in-memory storage object as the storage interface.  ` +
      `Call 'login' with a valid storage interface for 'options.storage'`
    )
    return memStorage()
  }
}

const defaultLoginOptions = (): loginOptions => ({
  redirectUri: currentUrl(),
  storage: defaultStorage()
})

const defaultCurrentUserOptions = (): currentUserOptions => ({
  storage: defaultStorage()
})

export const login = (idp: string, options: loginOptions = defaultLoginOptions()): Promise<authResponse> =>
  loginWebIdTls(idp)
    .then(webId => webId
      ? { webId, fetch }
      : loginWebIdOidc(idp, options).then(webId => ({ webId, fetch }))
    )

const loginWebIdTls = (idp: string): Promise<string> =>
  fetch(idp, { method: 'OPTIONS', credentials: 'include' })
    .then(resp => resp.headers.get('user'))

const loginWebIdOidc = (idp: string, { storage, redirectUri }: loginOptions): Promise<string> => {
  const oidcClient = new ClientAuthOIDC({ localStorage: storage })
  return oidcClient.registerClient(idp, { redirectUri: redirectUri })
    .then(() => oidcClient.login(idp))
}

export const currentUser = (idp: string, options: currentUserOptions = defaultCurrentUserOptions()): Promise<authResponse> =>
  loginWebIdTls(idp)
    .then(webId => webId
      ? { webId, fetch }
      : currentUserWebIdOidc(idp, options)
    )

const currentUserWebIdOidc = (idp: string, { storage }: currentUserOptions = defaultCurrentUserOptions()): Promise<authResponse> => {
  const oidcClient = new ClientAuthOIDC({ localStorage: storage })
  return oidcClient.loadClient(idp)
    .then(oidcRp => {
      if (oidcRp == null) {
        return { webId: null, fetch }
      }
      // using this undocumented API becaues there is currently no way to tell
      // the oidc client to initialize itself from persisted id/access tokens.
      oidcClient.currentClient = oidcRp
      oidcClient.extractAndValidateWebId(oidcRp)
      return { webId: oidcClient.webId, fetch }
    })
}
