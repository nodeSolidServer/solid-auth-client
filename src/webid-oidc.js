// @flow
import RelyingParty from 'oidc-rp'

import type { loginOptions } from './'
import type { Storage } from './storage'
import { NAMESPACE, defaultStorage } from './storage'

export const login = (idp: string, options: loginOptions): Promise<any> =>
  getRegisteredRp(idp, options).then(rp => sendAuthRequest(rp, options))

export const getRegisteredRp = (idp: string, { storage, redirectUri }: loginOptions): Promise<RelyingParty> => {
  const store = JSON.parse(storage.getItem(NAMESPACE) || '{}')
  // Try to use the saved registration
  if (store.rp_configs && store.rp_configs[idp]) {
    return RelyingParty.from(store.rp_configs[idp])
  }
  // If there's no saved registration, register for the first time
  const responseType = 'id_token token'
  const registration = {
    issuer: idp,
    grant_types: [ 'implicit' ],
    redirect_uris: [ redirectUri ],
    response_types: [ responseType ],
    scope: 'openid profile'
  }
  const options = {
    defaults: {
      authenticate: {
        redirect_uri: redirectUri,
        response_type: responseType
      }
    },
    store: storage
  }
  return RelyingParty.register(idp, registration, options)
    .then(rp => {
      const updatedStore = { ...store }
      if (!updatedStore.rp_configs) {
        updatedStore.rp_configs = {}
      }
      updatedStore.rp_configs[idp] = rp.serialize()
      storage.setItem(NAMESPACE, JSON.stringify(updatedStore))
      return rp
    })
}

const sendAuthRequest = (rp: RelyingParty, { redirectUri, storage }: loginOptions): Promise<void> =>
  rp.createRequest({ redirect_uri: redirectUri }, storage)
    .then(authUrl => { window.location.href = authUrl })

// export const currentUser = (idp: string, { storage }: { storage: Storage } = { storage: defaultStorage() }): Promise<authResponse> => {
//   const oidcClient = new ClientAuthOIDC({ localStorage: storage })
//   return oidcClient.loadClient(idp)
//     .then(oidcRp => {
//       if (oidcRp == null) {
//         return { webId: null, fetch }
//       }
//       // using this undocumented API becaues there is currently no way to tell
//       // the oidc client to initialize itself from persisted id/access tokens.
//       oidcClient.currentClient = oidcRp
//       oidcClient.extractAndValidateWebId(oidcRp)
//       return { webId: oidcClient.webId, fetch }
//     })
// }
