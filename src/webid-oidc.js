// @flow
import RelyingParty from '@trust/oidc-rp'

import type { loginOptions } from './api'
import type { session } from './session'
import type { Storage } from './storage'
import { defaultStorage, getData, updateStorage } from './storage'
import { currentUrl, clearHashFragment } from './util'

export const login = (idp: string, options: loginOptions): Promise<any> =>
  getRegisteredRp(idp, options).then(rp => sendAuthRequest(rp, options))

export const currentSession = (storage: Storage = defaultStorage()): Promise<?session> => {
  return getStoredRp(storage)
    .then(rp => {
      if (!rp) { return null }
      return rp.validateResponse(currentUrl() || '', storage)
    })
    .then(resp => {
      if (!resp) { return null }
      clearHashFragment()
      return {
        idp: resp.decoded.payload.iss,
        webId: resp.decoded.payload.sub,
        idToken: resp.params.id_token,
        accessToken: resp.params.access_token
      }
    })
}

export const logout = (storage: Storage): Promise<void> =>
  getStoredRp(storage)
    .then(rp => rp ? rp.logout() : undefined)

export const getRegisteredRp = (idp: string, options: loginOptions): Promise<RelyingParty> =>
  getStoredRp(options.storage)
    .then(rp => {
      if (rp && rp.provider.url === idp) { return rp }
      return registerRp(idp, options)
        .then(rp => storeRp(options.storage, idp, rp))
    })

const getStoredRp = (storage: Storage): Promise<?RelyingParty> => {
  const { rpConfig } = getData(storage)
  return rpConfig ? RelyingParty.from(rpConfig) : Promise.resolve(null)
}

const storeRp = (storage: Storage, idp: string, rp: RelyingParty): RelyingParty => {
  updateStorage(storage, data => ({
    ...data,
    rpConfig: rp
  }))
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
