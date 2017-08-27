// @flow
import type { loginOptions } from './api'
import type { handler, request, response } from './ipc'
import { combineHandlers, server } from './ipc'
import type { session } from './session'
import type { AsyncStorage } from './storage'
import { originOf } from './url-util'

const popupAppRequestHandler = (
  store: AsyncStorage,
  options: loginOptions,
  foundSessionCb: session => void
): handler =>
  combineHandlers(storageHandler(store), loginHandler(options, foundSessionCb))

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
  foundSessionCb: session => void
) => (req: request): ?Promise<response> => {
  const { id, method, args } = req
  switch (method) {
    case 'getLoginOptions':
      return Promise.resolve({
        id,
        ret: {
          idpSelectUri: options.idpSelectUri,
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

export const startPopupServer = (
  store: AsyncStorage,
  childWindow: window,
  options: loginOptions
): Promise<?session> => {
  return new Promise((resolve, reject) => {
    if (!(options.idpSelectUri && options.callbackUri)) {
      return reject(
        new Error(
          'Cannot serve a popup without both "options.idpSelectUri" and "options.callbackUri"'
        )
      )
    }
    const popupServer = server(childWindow, originOf(options.idpSelectUri))(
      popupAppRequestHandler(store, options, (session: session) => {
        popupServer.stop()
        resolve(session)
      })
    )
    popupServer.start()
  })
}

export const openIdpSelector = (options: loginOptions): window => {
  if (!(options.idpSelectUri && options.callbackUri)) {
    throw new Error(
      'Cannot open IDP select UI.  Must provide both "options.idpSelectUri" and "options.callbackUri".'
    )
  }
  const width = 750
  const height = 500
  const w = window.open(
    options.idpSelectUri,
    '_blank',
    `width=${width},height=${height},left=${(window.innerWidth - width) /
      2},top=${(window.innerHeight - height) / 2}`
  )
  return w
}
