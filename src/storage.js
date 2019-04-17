// @flow
import { Client } from './ipc'

export const NAMESPACE = 'solid-auth-client'

export interface AsyncStorage {
  getItem(key: string): Promise<?string>;
  setItem(key: string, val: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export type Storage = Storage | AsyncStorage

export const defaultStorage = () => {
  try {
    if (window && window.localStorage) {
      return asyncStorage(window.localStorage)
    }
  } catch (e) {
    if (!(e instanceof ReferenceError)) {
      throw e
    }
  }
  console.warn(
    `'window.localStorage' unavailable.  ` +
      `Creating a (not very useful) in-memory storage object as the default storage interface.`
  )
  return asyncStorage(memStorage())
}

/**
 * Takes a synchronous storage interface and wraps it with an async interface.
 */
export function asyncStorage(storage: Storage): AsyncStorage {
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

export function ipcStorage(client: Client): AsyncStorage {
  return {
    getItem: (key: string): Promise<?string> =>
      client.request('storage/getItem', key),

    setItem: (key: string, val: string): Promise<void> =>
      client.request('storage/setItem', key, val),

    removeItem: (key: string): Promise<void> =>
      client.request('storage/removeItem', key)
  }
}

export class StorageSession {
  _id: string
  _storage: AsyncStorage

  constructor(id: string, storage: AsyncStorage) {
    this._id = `${NAMESPACE}-storage-${id}`
    this._storage = storage
  }

  async get(key: string): Promise<any> {
    const data = await this.getData()
    return key in data ? data[key] : null
  }

  async getData(): Promise<Object> {
    const serialized = await this._storage.getItem(this._id)
    return typeof serialized === 'string' ? JSON.parse(serialized) : {}
  }

  async set(key: string, val: any): Promise<void> {
    const data = await this.getData()
    data[key] = val
    return this.setData(data)
  }

  async setData(data: Object): Promise<void> {
    const serialized = JSON.stringify(data)
    return this._storage.setItem(this._id, serialized)
  }

  async remove(key: string): Promise<void> {
    const data = await this.getData()
    delete data[key]
    return this.setData(data)
  }
}

export const SESSION_KEY = 'session'
export const HOSTS_KEY = 'hosts'
