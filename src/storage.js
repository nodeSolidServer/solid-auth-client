// @flow

export const NAMESPACE = 'solid-auth-client'

export interface Storage {
  getItem (key: string): ?string;
  setItem (key: string, val: string): void;
}

export const memStorage = () => {
  const store = {}
  return {
    getItem (key: string) {
      if (typeof store[key] === 'undefined') return null
      return store[key]
    },
    setItem (key: string, val: string) {
      store[key] = val
    }
  }
}

export const defaultStorage = () => {
  if (window && window.localStorage) {
    return window.localStorage
  } else {
    console.warn(
      `'window.localStorage' unavailable.  ` +
      `Passing a (not very useful) in-memory storage object as the storage interface.  ` +
      `Call 'login' with a valid storage interface for 'options.storage'`
    )
    return memStorage()
  }
}
