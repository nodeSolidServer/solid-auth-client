// @flow
import EventEmitter from 'events'
import { openIdpPopup, obtainSession } from './popup'

import { defaultStorage } from './storage'

import { toUrlString, currentUrlNoParams } from './url-util'

import { customAuthFetcher } from '../../../solid-auth-fetcher/dist/index'

export default class SolidAuthClient extends EventEmitter {
  async getAuthFetcher(storage) {
    if (storage) {
      return customAuthFetcher({
        storage: {
          get: key => storage.getItem(key),
          set: (key, value) => storage.setItem(key, value),
          delete: key => storage.removeItem(key)
        }
      })
    } else {
      return customAuthFetcher({})
    }
  }

  async fetch(input, options) {
    const authFetcher = await this.getAuthFetcher()
    this.emit('request', toUrlString(input))
    // @ts-ignore TODO: reconcile the input type
    return authFetcher.fetch(input, options)
  }

  async login(idp, options) {
    options = { ...defaultLoginOptions(currentUrlNoParams()), ...options }
    const authFetcher = await this.getAuthFetcher(options.storage)
    await authFetcher.login({
      redirect: options.callbackUri,
      clientId: options.clientName,
      oidcIssuer: idp
    })
  }

  async popupLogin(options) {
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

  async currentSession(storage) {
    const authFetcher = await this.getAuthFetcher(storage)
    const newSession = await authFetcher.getSession()
    return {
      webId: newSession.webId
    }
  }

  async trackSession(callback) {
    /* eslint-disable standard/no-callback-literal */
    callback(await this.currentSession())
    this.on('session', callback)
  }

  stopTrackSession(callback) {
    this.removeListener('session', callback)
  }

  async logout(storage = defaultStorage()) {
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

function defaultLoginOptions(url) {
  return {
    callbackUri: url ? url.split('#')[0] : '',
    popupUri: '',
    storage: defaultStorage()
  }
}
