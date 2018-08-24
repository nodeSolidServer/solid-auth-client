import SolidAuthClient from './solid-auth-client'

// Export a singleton instance of SolidAuthClient
const auth = new SolidAuthClient()
export default auth

// Bind methods to instance, so they can be invoked as regular functions
// (e.g., to pass around the fetch function)
Object.getOwnPropertyNames(SolidAuthClient.prototype).forEach(property => {
  const value = auth[property]
  if (typeof value === 'function') {
    auth[property] = value.bind(auth)
  }
})

// Backward compatibility: expose window.SolidAuthClient
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'SolidAuthClient', {
    enumerable: true,
    get: () => {
      console.warn('window.SolidAuthClient has been deprecated.')
      console.warn('Please use window.solid.auth instead.')
      return auth
    }
  })
}
