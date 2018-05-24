// @flow
import type { loginOptions } from './api'
import type { handler, request, response } from './ipc'
import { combineHandlers, server } from './ipc'
import type { Session } from './session'
import type { AsyncStorage } from './storage'
import { originOf } from './url-util'

const popupAppRequestHandler = (
  store: AsyncStorage,
  options: loginOptions,
  foundSessionCb: Session => void
): handler =>
  combineHandlers(
    storageHandler(store),
    loginHandler(options, foundSessionCb),
    appOriginHandler
  )

export const storageHandler = (store: AsyncStorage) => (
  req: request
): ?Promise<response> => {
  const { id, method, args } = req
  switch (method) {
    case 'storage/getItem':
      return store.getItem(...args).then(item => ({ id, ret: item }))
    case 'storage/setItem':
      return store.setItem(...args).then(() => ({ id, ret: null }))
    case 'storage/removeItem':
      return store.removeItem(...args).then(() => ({ id, ret: null }))
    default:
      return null
  }
}

export const loginHandler = (
  options: loginOptions,
  foundSessionCb: Session => void
) => (req: request): ?Promise<response> => {
  const { id, method, args } = req
  switch (method) {
    case 'getLoginOptions':
      return Promise.resolve({
        id,
        ret: {
          popupUri: options.popupUri,
          callbackUri: options.callbackUri
        }
      })
    case 'foundSession':
      foundSessionCb(args[0])
      return Promise.resolve({ id, ret: null })
    default:
      return null
  }
}

export const appOriginHandler = (req: request): ?Promise<response> => {
  const { id, method } = req
  return method === 'getAppOrigin'
    ? Promise.resolve({ id, ret: window.location.origin })
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
    const popupServer = server(childWindow, originOf(options.popupUri || ''))(
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
