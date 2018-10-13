// @flow
import type { loginOptions } from './solid-auth-client'
import { combineHandlers, Server } from './ipc'
import type { Session } from './session'
import type { AsyncStorage } from './storage'
import { originOf } from './url-util'

const popupAppRequestHandler = (
  store: AsyncStorage,
  options: loginOptions,
  foundSessionCb: Session => void
) =>
  combineHandlers(
    storageHandler(store),
    loginHandler(options, foundSessionCb),
    appOriginHandler
  )

export const storageHandler = (store: AsyncStorage) => (
  method: string,
  ...args: any[]
): ?Promise<any> => {
  switch (method) {
    case 'storage/getItem':
      return store.getItem(...args)
    case 'storage/setItem':
      return store.setItem(...args)
    case 'storage/removeItem':
      return store.removeItem(...args)
    default:
      return null
  }
}

export const loginHandler = (
  options: loginOptions,
  foundSessionCb: Session => void
) => (method: string, ...args: any[]): ?Promise<any> => {
  switch (method) {
    case 'getLoginOptions':
      return Promise.resolve({
        popupUri: options.popupUri,
        callbackUri: options.callbackUri
      })
    case 'foundSession':
      foundSessionCb(...args)
      return Promise.resolve(null)
    default:
      return null
  }
}

export const appOriginHandler = (method: string): ?Promise<any> => {
  return method === 'getAppOrigin'
    ? Promise.resolve(window.location.origin)
    : null
}

export const startPopupServer = (
  store: AsyncStorage,
  childWindow: window,
  options: loginOptions
): Promise<?Session> => {
  return new Promise((resolve, reject) => {
    if (!(options.popupUri && options.callbackUri)) {
      return reject(
        new Error(
          'Cannot serve a popup without both "options.popupUri" and "options.callbackUri"'
        )
      )
    }
    const popupServer = new Server(
      childWindow,
      originOf(options.popupUri || ''),
      popupAppRequestHandler(store, options, (session: Session) => {
        popupServer.stop()
        resolve(session)
      })
    )
    popupServer.start()
  })
}

export const openIdpSelector = (options: loginOptions): window => {
  if (!(options.popupUri && options.callbackUri)) {
    throw new Error(
      'Cannot open IDP select UI.  Must provide both "options.popupUri" and "options.callbackUri".'
    )
  }
  const width = 650
  const height = 400
  const w = window.open(
    options.popupUri,
    '_blank',
    `width=${width},height=${height},left=${(window.innerWidth - width) /
      2},top=${(window.innerHeight - height) / 2}`
  )
  return w
}
