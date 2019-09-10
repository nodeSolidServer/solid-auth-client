// @flow
import type { loginOptions } from './solid-auth-client'
import { Server } from './ipc'
import type { Session } from './webid-oidc'
import type { AsyncStorage } from './storage'
import { originOf } from './url-util'

export function openIdpPopup(popupUri: string): window {
  const width = 650
  const height = 400
  const left = window.screenX + (window.innerWidth - width) / 2
  const top = window.screenY + (window.innerHeight - height) / 2
  const settings = `width=${width},height=${height},left=${left},top=${top}`
  return window.open(popupUri, 'solid-auth-client', settings)
}

export function obtainSession(
  sessionId: string,
  store: AsyncStorage,
  popup: window,
  options: loginOptions
): Promise<?Session> {
  return new Promise((resolve, reject) => {
    const popupServer = new Server(
      popup,
      originOf(options.popupUri || ''),
      popupHandler(sessionId, store, options, (session: Session) => {
        popupServer.stop()
        resolve(session)
      })
    )
    popupServer.start()
  })
}

export function popupHandler(
  sessionId: string,
  store: AsyncStorage,
  { popupUri, callbackUri }: loginOptions,
  foundSessionCb: Session => void
) {
  return async (method: string, ...args: any[]) => {
    switch (method) {
      // Origin
      case 'getAppOrigin':
        return window.location.origin

      case 'getSessionId':
        return sessionId

      case 'storage/getItem':
        return store.getItem(...args)
      case 'storage/setItem':
        return store.setItem(...args)
      case 'storage/removeItem':
        return store.removeItem(...args)

      // Login
      case 'getLoginOptions':
        return { popupUri, callbackUri }
      case 'foundSession':
        foundSessionCb(...args)
    }
  }
}
