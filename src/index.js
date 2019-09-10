import SolidAuthClient from './solid-auth-client'

// Export a default instance of SolidAuthClient
const auth = new SolidAuthClient('solid-auth-client')
auth.SolidAuthClient = SolidAuthClient
auth.getActiveClients = SolidAuthClient.getActiveClients
export default auth

// Bind methods to instance, so they can be invoked as regular functions
// (e.g., to pass around the fetch function)
Object.getOwnPropertyNames(SolidAuthClient.prototype).forEach(property => {
  const value = auth[property]
  if (typeof value === 'function') {
    auth[property] = value.bind(auth)
  }
})

// Expose window.SolidAuthClient for backward compatibility
if (typeof window !== 'undefined') {
  if ('SolidAuthClient' in window) {
    console.warn('Caution: multiple versions of solid-auth-client active.')
  } else {
    let warned = false
    Object.defineProperty(window, 'SolidAuthClient', {
      enumerable: true,
      get: () => {
        if (!warned) {
          warned = true
          console.warn('window.SolidAuthClient has been deprecated.')
          console.warn('Please use window.solid.auth instead.')
        }
        return auth
      }
    })
  }
}
