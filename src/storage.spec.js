// @flow
/* eslint-env mocha */
/* global expect */

import type { AsyncStorage } from './storage'
import { defaultStorage } from './storage'

describe('defaultStorage', () => {
  it('returns a MemoryStorage if window is not available', () => {
    const { window } = global
    delete global.window
    const storage: AsyncStorage = defaultStorage()
    storage.setItem('foo', 'bar')
    expect(storage.getItem('foo')).toBe('bar')
    global.window = window
  })
})
