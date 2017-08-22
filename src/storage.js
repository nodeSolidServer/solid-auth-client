// @flow
import uuid from 'uuid/v4'

export const NAMESPACE = 'solid-auth-client'

export interface AsyncStorage {
  getItem (key: string): Promise<?string>;
  setItem (key: string, val: string): Promise<void>;
  removeItem (key: string): Promise<void>;
}

export type SyncStorage = Storage

export type Storage =
  | SyncStorage
  | AsyncStorage

export const defaultStorage = () => {
  try {
    if (window && window.localStorage) {
      return asyncStorage(window.localStorage)
    }
  } catch (e) {
    if (!(e instanceof ReferenceError)) { throw e }
  }
  console.warn(
    `'window.localStorage' unavailable.  ` +
    `Creating a (not very useful) in-memory storage object as the default storage interface.`
  )
  return asyncStorage(memStorage())
}

/**
 * Gets the deserialized stored data
 */
export async function getData (store: Storage): Promise<Object> {
  let serialized
  let data
  try {
    serialized = await store.getItem(NAMESPACE)
    data = JSON.parse(serialized || '{}')
  } catch (e) {
    console.warn('Could not deserialize data:', serialized)
    console.error(e)
    data = {}
  }
  return data
}

/**
 * Updates a Storage object without mutating its intermediate representation.
 */
export async function updateStorage (store: Storage, update: (Object) => Object): Promise<Object> {
  const currentData = await getData(store)
  const newData = update(currentData)
  store.setItem(NAMESPACE, JSON.stringify(newData))
  return newData
}

/**
 * Takes a synchronous storage interface and wraps it with an async interface.
 */
export function asyncStorage (storage: Storage): AsyncStorage {
  return {
    getItem: (key: string): Promise<?string> => {
      return Promise.resolve(storage.getItem(key))
    },

    setItem: (key: string, val: string): Promise<void> => {
      return Promise.resolve(storage.setItem(key, val))
    },

    removeItem: (key: string): Promise<void> => {
      return Promise.resolve(storage.removeItem(key))
    }
  }
}

export const memStorage = (): Storage => {
  const store = {}
  return {
    getItem: (key: string): ?string => {
      if (typeof store[key] === 'undefined') return null
      return store[key]
    },
    setItem: (key: string, val: string): void => {
      store[key] = val
    },
    removeItem: (key: string): void => {
      delete store[key]
    }
  }
}

export const postMessageStorage = (storageWindow: window, storageOrigin: string): AsyncStorage => {
  const request = requestFactory(storageWindow, storageOrigin)
  return {
    getItem: (key: string): Promise<?string> => {
      return request({ method: 'storage/getItem', args: [ key ] })
    },

    setItem: (key: string, val: string): Promise<void> => {
      return request({ method: 'storage/setItem', args: [ key, val ] })
    },

    removeItem: (key: string): Promise<void> => {
      return request({ method: 'storage/removeItem', args: [ key ] })
    }
  }
}

type response =
  { id: string
  , ret: any
  }

const requestFactory = (w: window, reqOrigin: string) => (options: { method: string, args: string[] }): Promise<response> => {
  return new Promise((resolve, reject) => {
    const reqId = uuid()
    const responseListener = (event) => {
      const { data, origin } = event
      if (origin !== reqOrigin) { return }
      if (!data['solid-auth-client']) { return }
      const response = data['solid-auth-client']
      if (response.id !== reqId) { return }
      resolve(response.ret)
      window.removeEventListener('message', responseListener)
    }
    window.addEventListener('message', responseListener)
    w.postMessage({
      'solid-auth-client': {
        id: reqId,
        method: options.method,
        args: options.args
      }
    }, reqOrigin)
  })
}
