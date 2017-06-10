// @flow

export const currentUrl = (): ?string => {
  if (window && window.location) {
    return window.location.href
  } else {
    console.warn(
      `'window.location' unavailable.  ` +
      `Passing 'undefined' as the redirectUri.  ` +
      `Call 'login' with a valid URL for 'options.redirectUri'`
    )
    return undefined
  }
}
