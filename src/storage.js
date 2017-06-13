// @flow

export const NAMESPACE = 'solid-auth-client'

export interface Storage {
  getItem (key: string): ?string;
  setItem (key: string, val: string): void;
}

export const memStorage = (): Storage => {
  const store = {}
  store.getItem = (key: string): ?string => {
    if (typeof store[key] === 'undefined') return null
    return store[key]
  }
  store.setItem = (key: string, val: string) => {
    store[key] = val
  }
  return store
}

export const defaultStorage = () => {
  if (window && window.localStorage) {
    return window.localStorage
  } else {
    console.warn(
      `'window.localStorage' unavailable.  ` +
      `Creating a (not very useful) in-memory storage object as the default storage interface.`
    )
    return memStorage()
  }
}

/**
 * Gets the deserialized stored data
 */
export const getData = (store: Storage) =>
  JSON.parse(store.getItem(NAMESPACE) || '{}')

/**
 * Updates a Storage object without mutating its intermediate representation.
 */
export const updateStorage = (store: Storage, update: (Object) => Object): Object => {
  const currentData = getData(store)
  const newData = update(currentData)
  store.setItem(NAMESPACE, JSON.stringify(newData))
  return newData
}
