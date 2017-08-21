// @flow

export const NAMESPACE = 'solid-auth-client'

export class AsyncStorage {
  async getItem (key: string): Promise<?string> {}
  async setItem (key: string, val: string): Promise<void> {}
  async getItems (): Promise<{ [string]: string }> { throw new Error() }
  async setItems (hash: { [string]: string }): Promise<void> {
    const setters = Object.keys(hash).map(k => this.setItem(k, hash[k]))
    await Promise.all(setters)
  }

  /**
   * Gets the deserialized stored data
   */
  async getData (): Promise<Object> {
    const item = await this.getItem(NAMESPACE)
    return item ? JSON.parse(item) : {}
  }

  /**
   * Updates the storage without mutating the intermediate representation
   */
  async update (update: (Object) => Object): Promise<Object> {
    const currentData = await this.getData()
    const newData = update(currentData)
    await this.setItem(NAMESPACE, JSON.stringify(newData))
    return newData
  }
}

export class MemoryStorage extends AsyncStorage {
  store = {}
  async getItem (key: string): Promise<?string> {
    return key in this.store ? this.store[key] : null
  }
  async setItem (key: string, val: string): Promise<void> {
    this.store[key] = val
  }
  async getItems (): Promise<{ [string]: string }> {
    return this.store
  }
}

export class LocalStorage extends AsyncStorage {
  async getItem (key: string): Promise<?string> {
    return window.localStorage.getItem(key)
  }
  async setItem (key: string, val: string): Promise<void> {
    window.localStorage.setItem(key, val)
  }
  async getItems (): Promise<{ [string]: string }> {
    const hash = {}
    for (var i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      hash[key] = window.localStorage.getItem(key)
    }
    return hash
  }
}

export const defaultStorage = (): AsyncStorage => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return new LocalStorage()
  }
  console.warn(
    `'window.localStorage' unavailable.  ` +
    `Creating a (not very useful) in-memory storage object as the default storage interface.`
  )
  return new MemoryStorage()
}
