// @flow
/* eslint-env browser */

export const currentUrl = (): string => window.location.href

export const currentUrlNoParams = (): string =>
  window.location.origin + window.location.pathname

export const navigateTo = (url: string) => {
  window.location.href = url
}

export const originOf = (url: string): string => new URL(url).origin

export const toUrlString = (url: any): string => {
  if (typeof url !== 'string') {
    url = 'url' in url ? url.url : url.toString()
  }
  return new URL(url, currentUrl()).toString()
}
