/* eslint-env browser */
import { memStorage } from '../src/storage'

import URLSearchParams from 'url-search-params'

let _href
let _URL

// polyfill missing/incomplete web apis
export const polyfillWindow = () => {
  _href = window.location.href
  Object.defineProperty(window.location, 'href', {
    writable: true,
    value: 'https://app.biz/'
  })
  Object.defineProperty(window.location, 'pathname', {
    writable: true,
    value: '/'
  })
  _URL = window.URL
  window.URL = function(urlStr) {
    const url = new _URL(urlStr)
    url.searchParams = new URLSearchParams(url.search)
    return url
  }
  window.URLSearchParams = URLSearchParams
  window.localStorage = memStorage()
  // this is fixed in the latest jsdom, but jest has not yet updated the jsdom dependency
  window.origin = window.location.origin
  Object.defineProperty(MessageEvent.prototype, 'origin', {
    writable: true,
    value: window.origin
  })
  MessageEvent.prototype.origin = window.location.origin
}

export const polyunfillWindow = () => {
  delete window.localStorage
  delete window.URLSearchParams
  window.URL = _URL
  window.location.href = _href
  delete window.origin
}
