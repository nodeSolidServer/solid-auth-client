// @flow
/* eslint-env mocha */
/* global expect */

import type { AsyncStorage } from './storage'
import { defaultStorage } from './storage'

describe('defaultStorage', () => {
  it('returns a MemoryStorage if window is not available', async () => {
    const { window } = global
    delete global.window
    const storage: AsyncStorage = defaultStorage()
    await storage.setItem('foo', 'bar')
    expect(await storage.getItem('foo')).toBe('bar')
    global.window = window
  })
})
