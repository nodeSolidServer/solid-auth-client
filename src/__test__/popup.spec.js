// @flow
/* eslint-env jest */
import { obtainSession, popupHandler } from '../popup'
import { polyfillWindow, polyunfillWindow } from './spec-helpers'
import { defaultStorage } from '../storage'

beforeEach(polyfillWindow)

afterEach(polyunfillWindow)

describe('obtainSession', () => {
  it('resolves to the captured session once it captures the "foundSession" method', async () => {
    expect.assertions(1)
    const store = defaultStorage()
    const session = {
      idp: 'https://localhost',
      webId: 'https://localhost/profile#me'
    }
    const sessionPromise = obtainSession(store, window, {
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

describe('popupHandler', () => {
  let store
  let handler
  const mockCallback = jest.fn()

  const options = {
    popupUri: 'https://localhost/select-idp',
    callbackUri: 'https://localhost/callback',
    storage: defaultStorage()
  }

  beforeEach(() => {
    store = defaultStorage()
    handler = popupHandler(store, options, mockCallback)
    mockCallback.mockReset()
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

  it('returns the loginOptions', async () => {
    expect.assertions(1)
    const _options = await handler('getLoginOptions')
    expect(_options).toEqual({
      popupUri: options.popupUri,
      callbackUri: options.callbackUri
    })
  })

  it('captures a found session', async () => {
    expect.assertions(3)
    const session = {
      idp: 'https://example.com',
      webId: 'https://me.example.com/profile#me'
    }
    const _sessionResp = await handler('foundSession', session)
    expect(_sessionResp).toBeUndefined()
    expect(mockCallback.mock.calls).toHaveLength(1)
    expect(mockCallback.mock.calls[0][0]).toEqual(session)
  })

  it('responds with the window origin', async () => {
    expect.assertions(1)
    const resp = await handler('getAppOrigin')
    expect(resp).toEqual('https://app.biz')
  })

  it('ignores unknown methods', async () => {
    expect.assertions(1)
    const resp = await handler('unknown_method')
    expect(resp).toBeUndefined()
  })
})
