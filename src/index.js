import SolidAuthClient from './solid-auth-client'

// Export a singleton instance of SolidAuthClient
const instance = new SolidAuthClient()
export default instance

// Bind methods to instance, so they can be invoked as regular functions
// (e.g., to pass around the fetch function)
Object.getOwnPropertyNames(SolidAuthClient.prototype).forEach(property => {
  const value = instance[property]
  if (typeof value === 'function') {
    instance[property] = value.bind(instance)
  }
})
