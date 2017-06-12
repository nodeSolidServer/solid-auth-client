/* eslint-env mocha */
/* global expect */
import { currentUrl, currentUrlNoParams } from './util'

const withoutLocation = (fn) => {
  const { location } = window
  delete window.location
  fn()
  window.location = location
}

describe('currentUrl', () => {
  it('returns the current url when window.location is available', () => {
    expect(currentUrl()).toBe('https://app.biz/page?foo=bar#more-params')
  })

  it('returns null when window.location is unavailable', () => {
    withoutLocation(() => expect(currentUrl()).toBeNull())
  })
})

describe('currentUrlNoParams', () => {
  it('returns the current url without the querystring or hash when window.location is available', () => {
    expect(currentUrlNoParams()).toBe('https://app.biz/page')
  })

  it('returns null when window.location is unavailable', () => {
    withoutLocation(() => expect(currentUrlNoParams()).toBeNull())
  })
})
