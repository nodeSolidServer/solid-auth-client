// @flow
/* eslint-env jest */
/* global Headers */

import { copyHeaders } from '../fetch-util'

describe('copyHeaders', () => {
  it('returns an object', () => expect(copyHeaders({})).toEqual({}))
  it('returns a copy of whatever is passed in as first param', () =>
    expect(copyHeaders({ foo: 42 })).toEqual({ foo: 42 }))
  it('handles option.headers as object', () =>
    expect(copyHeaders({ foo: 42 }, { headers: { bar: 1337 } })).toEqual({
      foo: 42,
      bar: 1337
    }))
  xit('handles options.headers as Headers', () => {
    // Enable this when there is support for window.Headers
    const headers = new Headers()
    headers.append('bar', '1337')
    expect(copyHeaders({ foo: '42' }, { headers })).toEqual({
      foo: '42',
      bar: '1337'
    })
  })
})
