// @flow
/* eslint-env browser */

function getLocation() {
  return typeof window !== 'undefined'
    ? window.location
    : { href: 'https://example.org/', pathname: '/', origin: 'example.org' }
}

export const currentUrl = (): string => getLocation().href

export const currentUrlNoParams = (): string =>
  getLocation().origin + getLocation().pathname

export const navigateTo = (url: string) => {
  getLocation().href = url
}

export const originOf = (url: string): string => new URL(url).origin

export const toUrlString = (url: any): string => {
  if (typeof url !== 'string') {
    url = 'url' in url ? url.url : url.toString()
  }
  return new URL(url, currentUrl()).toString()
}
