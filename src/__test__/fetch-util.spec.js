// @flow
/* eslint-env jest */

import { copyHeaders } from '../fetch-util'
import { polyfillWindow, polyunfillWindow } from './spec-helpers'

describe('copyHeaders', () => {
  beforeEach(() => polyfillWindow())
  afterEach(() => polyunfillWindow())

  it('returns an object', () => expect(copyHeaders({})).toEqual({}))
  it('returns a copy of whatever is passed in as first param', () =>
    expect(copyHeaders({ foo: 42 })).toEqual({ foo: 42 }))
  it('handles option.headers as object', () =>
    expect(copyHeaders({ foo: 42 }, { headers: { bar: 1337 } })).toEqual({
      foo: 42,
      bar: 1337
    }))
  xit('handles options.headers as Headers', () => {
    // TODO: Need to have Headers working
    const headers = new window.Headers()
    headers.append('bar', '1337')
    expect(copyHeaders({ foo: '42' }, { headers })).toEqual({
      foo: '42',
      bar: '1337'
    })
  })
})
