/* eslint-env jest */

import { polyfillWindow, polyunfillWindow } from './spec-helpers'
import type { AsyncStorage } from '../storage'
import { defaultStorage, ipcStorage } from '../storage'
import { Client } from '../ipc'

beforeEach(polyfillWindow)

afterEach(polyunfillWindow)

describe('defaultStorage', () => {
  it('returns a memStorage if window is not available', async () => {
    expect.assertions(1)
    const { window } = global
    delete global.window
    const storage: AsyncStorage = defaultStorage()
    await storage.setItem('foo', 'bar')
    const val = await storage.getItem('foo')
    expect(val).toBe('bar')
    global.window = window
  })
})

describe('ipcStorage', () => {
  ;[
    {
      expectedMethod: 'getItem',
      expectedArgs: ['foo'],
      expectedRet: 'bar'
    },
    {
      expectedMethod: 'setItem',
      expectedArgs: ['foo', 'bar'],
      expectedRet: null
    },
    {
      expectedMethod: 'removeItem',
      expectedArgs: ['foo'],
      expectedRet: null
    }
  ].forEach(({ expectedMethod, expectedArgs, expectedRet }) => {
    it(`requests '${expectedMethod}' over window.postMessage`, async done => {
      expect.assertions(3)
      window.addEventListener('message', function listener(event) {
        try {
          const storageRequest = event.data['solid-auth-client']
          const { id, method, args } = storageRequest
          if (!(id && method && args)) {
            return
          }
          expect(method).toBe(`storage/${expectedMethod}`)
          expect(args).toEqual(expectedArgs)
          window.postMessage(
            {
              'solid-auth-client': {
                id,
                ret: expectedRet
              }
            },
            window.location.origin
          )
          window.removeEventListener('message', listener)
        } catch (e) {
          done.fail(e)
        }
      })
      const client = new Client(window, window.location.origin)
      const store = ipcStorage(client)
      const item = await store[expectedMethod](...expectedArgs)
      expect(item).toBe(expectedRet)
      done()
    })
  })
})
