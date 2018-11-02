// @flow
/* eslint-env jest */

import { polyfillWindow, polyunfillWindow } from './spec-helpers'
import { Client, Server } from '../ipc'

beforeEach(polyfillWindow)

afterEach(polyunfillWindow)

describe('Client', () => {
  it('takes a request, sets up a channel to the parent window, and promises a response from the parent', async () => {
    expect.assertions(5)
    const parent = window
    // window.open is not yet implemented in jsdom.  for the purposes of testing, this does just fine.
    const child = parent
    const origin = window.location.origin
    const client = new Client(parent, origin)
    parent.addEventListener('message', function testServer(event) {
      const { data, origin } = event
      const isRequest =
        data &&
        typeof data === 'object' &&
        data['solid-auth-client'].method &&
        data['solid-auth-client'].args
      if (isRequest) {
        expect(origin).toBe(parent.location.origin)
        const request = data['solid-auth-client']
        const { id, method, args } = request
        expect(id).toBeTruthy()
        expect(method).toBe('foo')
        expect(args).toEqual(['bar', 'baz'])
        child.postMessage(
          {
            'solid-auth-client': {
              id,
              ret: 'the return value!'
            }
          },
          child.location.origin
        )
        parent.removeEventListener('message', testServer)
      }
    })
    const response = await client.request('foo', 'bar', 'baz')
    expect(response).toBe('the return value!')
  })

  it('ignores responses to other requests', async () => {
    expect.assertions(5)
    const parent = window
    // window.open is not yet implemented in jsdom.  for the purposes of testing, this does just fine.
    const child = parent
    const origin = window.location.origin
    const client = new Client(parent, origin)
    parent.addEventListener('message', function testServer(event) {
      const { data, origin } = event
      const isRequest =
        data &&
        typeof data === 'object' &&
        data['solid-auth-client'].method &&
        data['solid-auth-client'].args
      if (isRequest) {
        expect(origin).toBe(parent.location.origin)
        const request = data['solid-auth-client']
        const { id, method, args } = request
        expect(id).toBeTruthy()
        expect(method).toBe('foo')
        expect(args).toEqual(['bar', 'baz'])
        child.postMessage(
          {
            'solid-auth-client': {
              id: 'other-id',
              ret: 'other return value'
            }
          },
          child.location.origin
        )
        child.postMessage(
          {
            'solid-auth-client': {
              id,
              ret: 'the return value!'
            }
          },
          child.location.origin
        )
        parent.removeEventListener('message', testServer)
      }
    })
    const response = await client.request('foo', 'bar', 'baz')
    expect(response).toBe('the return value!')
  })
})

describe('Server', () => {
  it('only responds to valid requests', done => {
    expect.assertions(1)
    const parent = window
    const child = parent
    const handler = jest.fn()
    const server = new Server(child, child.location.origin, handler)
    server.start()
    parent.addEventListener('message', function listener() {
      try {
        expect(handler.mock.calls).toHaveLength(0)
        parent.removeEventListener('message', listener)
        done()
      } catch (e) {
        done.fail(e)
      } finally {
        server.stop()
      }
    })
    parent.postMessage('not-a-well-formed-message', parent.location.origin)
  })

  it('delegates to a handler to compute responses', done => {
    expect.assertions(3)
    const testHandler = jest.fn(async () => 'testHandler return value')
    const parent = window
    const child = parent
    const server = new Server(child, child.location.origin, testHandler)
    server.start()
    child.addEventListener('message', function listener(event) {
      try {
        const request = event.data['solid-auth-client']
        const { id, ret } = request
        if (!(id && ret)) {
          return
        }
        expect(testHandler.mock.calls[0]).toEqual(['foo', 'a', 'b', 'c'])
        expect(id).toBe('12345')
        expect(ret).toBe('testHandler return value')
        child.removeEventListener('message', listener)
        done()
      } catch (e) {
        done.fail(e)
      } finally {
        server.stop()
      }
    })
    parent.postMessage(
      {
        'solid-auth-client': {
          id: '12345',
          method: 'foo',
          args: ['a', 'b', 'c']
        }
      },
      parent.location.origin
    )
  })
})
