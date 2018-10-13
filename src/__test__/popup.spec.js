// @flow
/* eslint-env jest */
import {
  appOriginHandler,
  loginHandler,
  storageHandler,
  startPopupServer
} from '../popup'
import { polyfillWindow, polyunfillWindow } from './spec-helpers'
import { defaultStorage } from '../storage'

beforeEach(polyfillWindow)

afterEach(polyunfillWindow)

describe('storageHandler', () => {
  let store
  let handler

  beforeEach(() => {
    store = defaultStorage()
    handler = storageHandler(store)
  })

  it('implements getItem', async () => {
    expect.assertions(1)
    await store.setItem('foo', 'bar')
    const resp = await handler('storage/getItem', 'foo')
    expect(resp).toEqual('bar')
  })

  it('implements setItem', async () => {
    expect.assertions(2)
    const resp = await handler('storage/setItem', 'foo', 'bar')
    expect(resp).toEqual(undefined)
    expect(await store.getItem('foo')).toEqual('bar')
  })

  it('implements removeItem', async () => {
    expect.assertions(2)
    await store.setItem('foo', 'bar')
    const resp = await handler('storage/removeItem', 'foo')
    expect(resp).toEqual(undefined)
    expect(await store.getItem('foo')).toEqual(null)
  })

  it('ignores unknown methods', async () => {
    expect.assertions(1)
    const resp = await handler('unknown_method', 'a', 'b', 'c')
    expect(resp).toBeNull()
  })
})

describe('loginHandler', () => {
  const options = {
    popupUri: 'https://localhost/select-idp',
    callbackUri: 'https://localhost/callback',
    storage: defaultStorage()
  }

  it('returns the loginOptions', async () => {
    expect.assertions(1)
    const handler = loginHandler(options, () => {})
    const _options = await handler('getLoginOptions')
    expect(_options).toEqual({
      popupUri: options.popupUri,
      callbackUri: options.callbackUri
    })
  })

  it('captures a found session', async () => {
    expect.assertions(3)
    const mockCallback = jest.fn()
    const handler = loginHandler(options, mockCallback)
    const session = {
      idp: 'https://example.com',
      webId: 'https://me.example.com/profile#me'
    }
    const _sessionResp = await handler('foundSession', session)
    expect(_sessionResp).toEqual(null)
    expect(mockCallback.mock.calls.length).toBe(1)
    expect(mockCallback.mock.calls[0][0]).toEqual(session)
  })

  it('ignores unknown methods', async () => {
    expect.assertions(1)
    const handler = loginHandler(options, () => {})
    const resp = await handler('unknown_method', 'a', 'b', 'c')
    expect(resp).toBeNull()
  })
})

describe('appOriginHandler', () => {
  it('responds with the window origin', async () => {
    expect.assertions(1)
    const resp = await appOriginHandler('getAppOrigin')
    expect(resp).toEqual('https://app.biz')
  })

  it('ignores unknown methods', async () => {
    expect.assertions(1)
    const resp = await appOriginHandler('unknown_method')
    expect(resp).toBeNull()
  })
})

describe('startPopupServer', () => {
  it('rejects if loginOptions does not include both popupUri and callbackUri', async () => {
    expect.assertions(1)
    const store = defaultStorage()
    await expect(
      startPopupServer(store, window, {
        popupUri: '',
        callbackUri: '',
        storage: store
      })
    ).rejects.toBeInstanceOf(Error)
  })

  it('resolves to the captured session once it captures the "foundSession" method', async () => {
    expect.assertions(1)
    const store = defaultStorage()
    const session = {
      idp: 'https://localhost',
      webId: 'https://localhost/profile#me'
    }
    const sessionPromise = startPopupServer(store, window, {
      popupUri: 'https://app.biz/select-idp',
      callbackUri: 'https://app.biz/callback',
      storage: store
    })
    window.postMessage(
      {
        'solid-auth-client': {
          id: '12345',
          method: 'foundSession',
          args: [session]
        }
      },
      window.location.origin
    )
    const resolvedSession = await sessionPromise
    expect(resolvedSession).toEqual(session)
  })
})
