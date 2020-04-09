// @flow
import EventEmitter from 'events'
import { openIdpPopup, obtainSession } from './popup'

import { defaultStorage } from './storage'
import { toUrlString, currentUrlNoParams } from './url-util'
import type { AsyncStorage } from './storage'
import type { Session } from './session'
// $FlowFixMe
import { customAuthFetcher } from '../../../solid-auth-fetcher/dist/index'

export type loginOptions = {
  callbackUri: string,
  clientName?: string,
  contacts?: Array<string>,
  logoUri?: string,
  popupUri: string,
  storage: AsyncStorage
}

export default class SolidAuthClient extends EventEmitter {
  async getAuthFetcher(storage?: AsyncStorage) {
    if (storage) {
      const asyncStorage = storage
      return customAuthFetcher({
        storage: {
          get: key => asyncStorage.getItem(key),
          set: (key, value) => asyncStorage.setItem(key, value),
          delete: key => asyncStorage.removeItem(key)
        }
      })
    } else {
      return customAuthFetcher({})
    }
  }

  async fetch(input: RequestInfo, options?: RequestOptions): Promise<Response> {
    const authFetcher = await this.getAuthFetcher()
    this.emit('request', toUrlString(input))
    // @ts-ignore TODO: reconcile the input type
    return authFetcher.fetch(input, options)
  }

  async login(idp: string, options: loginOptions): Promise<?Session> {
    options = { ...defaultLoginOptions(currentUrlNoParams()), ...options }
    const authFetcher = await this.getAuthFetcher(options.storage)
    await authFetcher.login({
      redirect: options.callbackUri,
      clientId: options.clientName,
      oidcIssuer: idp
    })
  }

  async popupLogin(options: loginOptions): Promise<?Session> {
    options = { ...defaultLoginOptions(), ...options }
    if (!/https?:/.test(options.popupUri)) {
      options.popupUri = new URL(
        options.popupUri || '/.well-known/solid/login',
        window.location.href
      ).toString()
    }
    if (!options.callbackUri) {
      options.callbackUri = options.popupUri
    }
    const popup = openIdpPopup(options.popupUri)
    const session = await obtainSession(options.storage, popup, options)
    this.emit('login', session)
    this.emit('session', session)
    return session
  }

  async currentSession(storage?: AsyncStorage): Promise<?Session> {
    const authFetcher = await this.getAuthFetcher(storage)
    const newSession = await authFetcher.getSession()
    return {
      webId: newSession.webId,
      sessionKey: newSession.localUserId
    }
  }

  async trackSession(
    callback: Function,
    storage?: AsyncStorage
  ): Promise<void> {
    /* eslint-disable standard/no-callback-literal */
    callback(await this.currentSession(storage))
    this.on('session', callback)
  }

  stopTrackSession(callback: Function): void {
    this.removeListener('session', callback)
  }

  async logout(storage?: AsyncStorage): Promise<void> {
    const authFetcher = await this.getAuthFetcher(storage)
    const session = await this.currentSession(storage)
    if (session) {
      try {
        await authFetcher.logout()
        this.emit('logout')
        this.emit('session', null)
      } catch (err) {
        console.warn('Error logging out:')
        console.error(err)
      }
    }
  }
}

function defaultLoginOptions(url: ?string): loginOptions {
  return {
    callbackUri: url ? url.split('#')[0] : '',
    popupUri: '',
    storage: defaultStorage()
  }
}
