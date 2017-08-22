// @flow
import type { loginOptions } from './api'
import type { session } from './session'
import type { Storage } from './storage'
/*

request:
  - origin: https://app.io
  - data:
    { 'solid-auth-client':
      { id: 12345
      , call: 'setItem'
      , args: [ 'key', 'value' ]
      }
    }
response:
  - origin: https://popup.app.io
  - data:
    { 'solid-auth-client':
      { id: 12345
      , ret: null
      }
    }

*/

const NS = 'solid-auth-client'

/**
 * Sets up a little IPC server
 */
export const startPopupServer = (
  store: Storage,
  childWindow: window,
  childOrigin: string
): Promise<?session> => {
  const respond = response => {
    childWindow.postMessage({ 'solid-auth-client': response }, childOrigin)
  }
  return new Promise((resolve, reject) => {
    window.addEventListener('message', async function messageHandler(event) {
      const { data, origin } = event
      if (!data[NS]) {
        return
      }
      if (origin !== childOrigin) {
        console.warn(
          `SECURITY WARNING: solid-auth-client is listening for messages from ${childOrigin},` +
            ` but received a message from ${origin}.`
        )
        return
      }
      const { id, method, args } = data[NS]
      switch (method) {
        case 'storage/getItem':
          const item = await store.getItem(...args)
          respond({ id, ret: item })
          break
        case 'storage/setItem':
          await store.setItem(...args)
          respond({ id, ret: null })
          break
        case 'storage/removeItem':
          await store.removeItem(...args)
          respond({ id, ret: null })
          break
        case 'foundSession':
          respond({ id, ret: null })
          resolve(args[0])
          window.removeEventListener('message', messageHandler)
          break
        default:
          console.warn(
            `Child ${childOrigin} requested unsupported method ${method} with arguments ${args}`
          )
      }
    })
  })
}

export const openIdpSelector = (options: loginOptions): window => {
  const width = 750
  const height = 500
  const w = window.open(
    options.idpSelectUri,
    '_blank',
    `width=${width},height=${height},left=${(window.innerWidth - width) /
      2},top=${(window.innerHeight - height) / 2}`
  )
  w.addEventListener('load', () => {
    w.postMessage(
      {
        loginOptions: {
          idpSelectUri: options.idpSelectUri,
          redirectUri: options.redirectUri
        }
      },
      '*'
    )
  })
  return w
}
