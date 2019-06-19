// @flow
import { Client } from './ipc'

export const NAMESPACE = 'solid-auth-client'
const USED_IDS_ID = NAMESPACE + '__USED_IDS__'

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

/**
 * Class for storing data in one item spot of an AsyncStorage
 * If no ID is specified it will automatically generate a new one
 */
export class ItemStorage {
  _id: ?string
  _storageId: ?string
  _storage: AsyncStorage
  static isMarkingIdsAsUsed: number = 0

  constructor(id: ?string, storage: AsyncStorage) {
    this._storage = storage
    if (id) {
      this._id = id
      this._markAsUsed(id)
    }
  }

  async getId(): Promise<string> {
    if (!this._id) {
      this._id = await this._newId()
    }
    return this._id
  }

  async _getStorageId(): Promise<string> {
    if (!this._storageId) {
      const id = await this.getId()
      if (id === 'solid-auth-client') {
        this._storageId = id // Don't prefix for backwards compatibility
      } else {
        this._storageId = this._prefixId(id)
      }
    }
    return this._storageId
  }

  async get(key: string): Promise<any> {
    const data = await this.getData()
    return key in data ? data[key] : null
  }

  async getData(): Promise<Object> {
    const serialized = await this._storage.getItem(await this._getStorageId())
    return typeof serialized === 'string' ? JSON.parse(serialized) : {}
  }

  async set(key: string, val: any): Promise<void> {
    const data = await this.getData()
    data[key] = val
    return this.setData(data)
  }

  async setData(data: Object): Promise<void> {
    const serialized = JSON.stringify(data)
    return this._storage.setItem(await this._getStorageId(), serialized)
  }

  async remove(key: string): Promise<void> {
    const data = await this.getData()
    delete data[key]
    return this.setData(data)
  }

  async removeAll(): Promise<void> {
    await this._storage.removeItem(await this._getStorageId())
    await this._markAsUnused(await this.getId())
  }

  _prefixId(id: string): string {
    return `${NAMESPACE}-storage-${id}`
  }

  async _newId(): Promise<string> {
    const id = `__AUTO__${uuidv4()}__`
    await this._markAsUsed(id)
    return id
  }

  static async getUsedIds(
    storage: AsyncStorage
  ): Promise<{ [id: string]: boolean }> {
    while (ItemStorage.isMarkingIdsAsUsed) {
      await sleep(10)
    }
    return ItemStorage._getUsedIds(storage)
  }

  static async _getUsedIds(
    storage: AsyncStorage
  ): Promise<{ [id: string]: boolean }> {
    return storage
      .getItem(USED_IDS_ID)
      .then(data => (typeof data === 'string' ? JSON.parse(data) : {}))
  }

  _setUsedIds(ids: { [id: string]: boolean }): Promise<void> {
    return this._storage.setItem(USED_IDS_ID, JSON.stringify(ids))
  }

  async _markAsUsed(id: string): Promise<void> {
    ItemStorage.isMarkingIdsAsUsed++
    ItemStorage._getUsedIds(this._storage)
      .then(usedIds => {
        usedIds[id] = true
        return this._setUsedIds(usedIds)
      })
      .then(() => ItemStorage.isMarkingIdsAsUsed--)
      .catch(e => {
        ItemStorage.isMarkingIdsAsUsed--
        throw e
      })
  }

  async _markAsUnused(id: string): Promise<void> {
    const usedIds = await ItemStorage.getUsedIds(this._storage)
    delete usedIds[id]
    await this._setUsedIds(usedIds)
  }
}

// from http://web.archive.org/web/*/https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const SESSION_KEY = 'session'
export const HOSTS_KEY = 'hosts'
