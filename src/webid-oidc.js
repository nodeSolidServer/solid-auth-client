// @flow
import RelyingParty from 'oidc-rp'

import type { loginOptions } from './'
import type { session } from './session'
import { saveSession } from './session'
import type { Storage } from './storage'
import { NAMESPACE, defaultStorage, getData, updateStorage } from './storage'
import { currentUrl } from './util'

export const login = (idp: string, options: loginOptions): Promise<any> =>
  getRegisteredRp(idp, options).then(rp => sendAuthRequest(rp, options))

export const currentUser = (idp: string, { storage }: { storage: Storage } = { storage: defaultStorage() }): Promise<?session> => {
  return getStoredRp(storage, idp)
    .then(rp => {
      if (!rp) { return null }
      return rp.validateResponse(currentUrl() || '', storage)
    })
    .then(resp => {
      if (!resp) { return null }
      return {
        idp,
        webId: resp.decoded.payload.sub,
        idToken: resp.params.id_token,
        accessToken: resp.params.access_token
      }
    })
}

export const logout = (idp: string, options: { storage: Storage }): Promise<void> =>
  getStoredRp(options.storage, idp)
    .then(rp => rp ? rp.logout() : undefined)

export const getRegisteredRp = (idp: string, options: loginOptions): Promise<RelyingParty> =>
  getStoredRp(options.storage, idp)
    .then(rp => {
      if (rp) return rp
      return registerRp(idp, options)
        .then(rp => storeRp(options.storage, idp, rp))
    })

const getStoredRp = (storage: Storage, idp: string): Promise<?RelyingParty> => {
  const { rp_configs } = getData(storage)
  if (rp_configs && rp_configs[idp]) {
    return RelyingParty.from(rp_configs[idp])
  }
  return Promise.resolve(null)
}

const storeRp = (storage: Storage, idp: string, rp: RelyingParty): RelyingParty => {
  const store = JSON.parse(storage.getItem(NAMESPACE) || '{}')
  if (!store.rp_configs) {
    store.rp_configs = {}
  }
  store.rp_configs[idp] = rp
  storage.setItem(NAMESPACE, JSON.stringify(store))
  return rp
}

const registerRp = (idp: string, { storage, redirectUri }: loginOptions): Promise<RelyingParty> => {
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
}

const sendAuthRequest = (rp: RelyingParty, { redirectUri, storage }: loginOptions): Promise<void> =>
  rp.createRequest({ redirect_uri: redirectUri }, storage)
    .then(authUrl => { window.location.href = authUrl })
