// @flow
/* global fetch */
import EventEmitter from 'events'
import { authnFetch } from './authn-fetch'
import { openIdpPopup, obtainSession } from './popup'
import type { Session } from './webid-oidc'
import type { AsyncStorage } from './storage'
import { defaultStorage, ItemStorage, SESSION_KEY } from './storage'
import { toUrlString, currentUrlNoParams } from './url-util'
import * as WebIdOidc from './webid-oidc'

// Store the global fetch, so the user is free to override it
const globalFetch = fetch

export type loginOptions = {
  callbackUri: string,
  popupUri: string,
  storage: ItemStorage
}

export default class SolidAuthClient extends EventEmitter {
  _pendingSession: ?Promise<?Session>
  _storage: ItemStorage
  _asyncStorage: AsyncStorage

  constructor(id: ?string, asyncStorage: AsyncStorage = defaultStorage()) {
    super()
    this._storage = new ItemStorage(id, asyncStorage)
    this._asyncStorage = asyncStorage
  }

  static async getActiveClients(
    asyncStorage: AsyncStorage = defaultStorage()
  ): Promise<SolidAuthClient[]> {
    const ids = await ItemStorage.getUsedIds(asyncStorage).then(Object.keys)
    const clients: SolidAuthClient[] = ids.map(id => new SolidAuthClient(id, asyncStorage))
    const activeClients = filterAsync(clients, client => client.currentSession().then(session => !!session))
    return activeClients
  }

  getId(): Promise<string> {
    return this._storage.getId()
  }

  fetch(input: RequestInfo, options?: RequestOptions): Promise<Response> {
    this.emit('request', toUrlString(input))
    return authnFetch(this._storage, globalFetch, input, options)
  }

  // TODO: The storage parameter from options is not used now
  login(idp: string, options: loginOptions): Promise<?Session> {
    options = {
      ...defaultLoginOptions(currentUrlNoParams()),
      ...options,
      storage: this._storage
    }
    return WebIdOidc.login(idp, options)
  }

  // TODO: The storage parameter from options is not used now
  async popupLogin(options: loginOptions): Promise<?Session> {
    options = { ...defaultLoginOptions(), ...options, storage: this._storage }
    if (!/https?:/.test(options.popupUri)) {
      options.popupUri = new URL(
        options.popupUri || '/.well-known/solid/login',
        window.location
      ).toString()
    }
    if (!options.callbackUri) {
      options.callbackUri = options.popupUri
    }
    const id = await this._storage.getId()
    const popup = openIdpPopup(options.popupUri)
    const session = await obtainSession(id, this._asyncStorage, popup, options)
    this.emit('login', session)
    this.emit('session', session)
    return session
  }

  async currentSession(): Promise<?Session> {
    // Try to obtain a stored or pending session
    let session = this._pendingSession || (await this._storage.get(SESSION_KEY))

    // If none found, attempt to create a new session
    if (!session) {
      // Try to create a new OIDC session from stored tokens
      try {
        this._pendingSession = WebIdOidc.currentSession(this._storage)
        session = await this._pendingSession
      } catch (err) {
        console.error(err)
      }

      // Save the new session and emit session events
      if (session) {
        await this._storage.set(SESSION_KEY, session)
        this.emit('login', session)
        this.emit('session', session)
      }
      delete this._pendingSession
    }
    return session
  }

  async trackSession(callback: Function): Promise<void> {
    /* eslint-disable standard/no-callback-literal */
    callback(await this.currentSession())
    this.on('session', callback)
  }

  async logout(): Promise<void> {
    const session = await this._storage.get(SESSION_KEY)
    if (session) {
      try {
        await WebIdOidc.logout(this._storage, globalFetch)
        this.emit('logout')
        this.emit('session', null)
      } catch (err) {
        console.warn('Error logging out:')
        console.error(err)
      }
      await this._storage.set(SESSION_KEY, null)
    }
  }
}

function defaultLoginOptions(
  url: ?string
): { callbackUri: string, popupUri: string } {
  return {
    callbackUri: url ? url.split('#')[0] : '',
    popupUri: ''
  }
}

function filterAsync(
  array: any[],
  filter: (val: any) => Promise<boolean>
): any[] {
  return Promise.all(array.map(val => filter(val))).then(bits =>
    array.filter(() => bits.shift())
  )
}
