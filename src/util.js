// @flow
const whenLocationAvailable = <T>(fn: () => T): ?T => {
  if (window && window.location) {
    return fn()
  } else {
    console.warn(
      `'window.location' unavailable.  Returning 'null' as the current URL.`
    )
    return null
  }
}

export const currentUrl = (): ?string =>
  whenLocationAvailable(() => window.location.href)

export const currentUrlNoParams = (): ?string =>
  whenLocationAvailable(() => window.location.origin + window.location.pathname)
