/* eslint-env jest */
import { currentUrl, currentUrlNoParams } from '../url-util'

describe('currentUrl', () => {
  it('returns the current url when window.location is available', () => {
    expect(currentUrl()).toBe('https://app.biz/page?foo=bar#the-hash-fragment')
  })
})

describe('currentUrlNoParams', () => {
  it('returns the current url without the querystring or hash when window.location is available', () => {
    expect(currentUrlNoParams()).toBe('https://app.biz/page')
  })
})
