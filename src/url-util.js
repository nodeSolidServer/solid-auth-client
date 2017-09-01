// @flow
/* eslint-env browser */

export const currentUrl = (): ?string => window.location.href

export const currentUrlNoParams = (): ?string =>
  window.location.origin + window.location.pathname

export const clearHashFragment = () =>
  window.history.replaceState(
    '',
    document.title,
    window.location.pathname + window.location.search
  )

export const navigateTo = (url: string) => {
  window.location.href = url
}

export const originOf = (url: string): string => new URL(url).origin
