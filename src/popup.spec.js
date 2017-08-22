//@flow
import { startPopupServer } from './popup'
import { defaultStorage } from './storage'

describe('startPopupServer', () => {
  it(`rejects messages missing the 'solid-auth-client' namespace`, () => {})

  it('rejects messages from unexpected domains')

  it(`resolves to the session once it receives a 'foundSession' message`)

  describe('Storage API', () => {
    it('implements getItem')

    it('implements setItem')

    it('implements removeItem')
  })
})
