// @flow
/* eslint-env mocha */
/* global expect */

import type { AsyncStorage } from './storage'
import { defaultStorage } from './storage'

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
