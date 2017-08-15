// @flow

export const NAMESPACE = 'solid-auth-client'

export class AsyncStorage {
  getItem (key: string): ?string {}
  setItem (key: string, val: string): void {}
  getItems (): { [string]: string } { return {} }
  setItems (hash: { [string]: string }): void {
    for (const key in hash) {
      this.setItem(key, hash[key])
    }
  }

  /**
   * Gets the deserialized stored data
   */
  getData (): Object {
    return JSON.parse(this.getItem(NAMESPACE) || '{}')
  }

  /**
   * Updates the storage without mutating the intermediate representation
   */
  update (update: (Object) => Object): Object {
    const currentData = this.getData()
    const newData = update(currentData)
    this.setItem(NAMESPACE, JSON.stringify(newData))
    return newData
  }
}

export class MemoryStorage extends AsyncStorage {
  store = {}
  getItem (key: string): ?string {
    return key in this.store ? this.store[key] : null
  }
  setItem (key: string, val: string) {
    this.store[key] = val
  }
  getItems (): { [string]: string } {
    return this.store
  }
}

export class LocalStorage extends AsyncStorage {
  getItem (key: string): ?string {
    return window.localStorage.getItem(key)
  }
  setItem (key: string, val: string) {
    window.localStorage.setItem(key, val)
  }
  getItems (): { [string]: string } {
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
