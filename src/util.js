// @flow
export const currentUrl = (): ?string => {
  if (window && window.location) {
    return window.location.href
  } else {
    console.warn(
      `'window.location' unavailable.  Returning 'null' as the current URL.`
    )
    return null
  }
}
