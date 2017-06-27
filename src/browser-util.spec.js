/* eslint-env mocha */
/* global expect */
import { currentUrl, currentUrlNoParams } from './browser-util'

describe('currentUrl', () => {
  it('returns the current url when window.location is available', () => {
    expect(currentUrl()).toBe('https://app.biz/page?foo=bar#more-params')
  })
})

describe('currentUrlNoParams', () => {
  it('returns the current url without the querystring or hash when window.location is available', () => {
    expect(currentUrlNoParams()).toBe('https://app.biz/page')
  })
})
