// @flow
import 'whatwg-fetch'
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
  returnRoute?: string,
  rsWhitelist?: Array<string>,
  storage: Storage
}

const defaultLoginOptions = {
  returnRoute: '/',
  rsWhitelist: undefined,
  storage: window.localStorage
}

export const login = (idp: string, options?: loginOptions = defaultLoginOptions): Promise<authResponse> =>
  loginWebIdTls(idp)
    .then(webId => webId
      ? { webId, fetch }
      : loginWebIdOidc(idp, options.storage).then(webId => ({ webId, fetch }))
    )

const loginWebIdTls = (idp: string): Promise<string> =>
  fetch(idp, { method: 'OPTIONS', credentials: 'include' })
    .then(resp => resp.headers.get('user'))

const loginWebIdOidc = (idp: string, storage?: Storage): Promise<string> =>
  new ClientAuthOIDC({ localStorage: storage }).login(idp)
