export function copyHeaders(newHeaders, oldOptions = {}) {
  return {
    ...normalizeHeaders(oldOptions.headers),
    ...normalizeHeaders(newHeaders)
  }
}

function normalizeHeaders(headers = {}) {
  if (!headers.forEach) {
    return headers
  }
  const newHeaders = {}
  headers.forEach((value, key) => {
    newHeaders[key] = value
  })
  return newHeaders
}
