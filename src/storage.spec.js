// @flow
/* eslint-env mocha */
/* global expect */

import type { Storage } from './storage'
import { defaultStorage } from './storage'

describe('defaultStorage', () => {
  it('returns a memStorage if window is not available', () => {
    const { window } = global
    delete global.window
    const storage: Storage = defaultStorage()
    storage.setItem('foo', 'bar')
    expect(storage.getItem('foo')).toBe('bar')
    global.window = window
  })
})
