// @flow
import uuid from 'uuid/v4'

/*
  This module describes a simple IPC interface for communicating between browser windows.
  Window.postMessage() is the transport interface, and a request/response interface
  is defined on top of it as follows:

  const request = {
    'solid-auth-client': {
      id: 'abcd-efgh-ijkl',
      method: 'doSomethingPlease',
      args: [ 'one', 'two', 'three' ]
    }
  }

  const response = {
    'solid-auth-client': {
      id: 'abcd-efgh-ijkl',
      ret: 'the_value'
    }
  }
*/

export type request = {
  id: string,
  method: string,
  args: any[]
}

export type response = {
  id: string,
  ret: any
}

export type handler = request => ?Promise<response>

export interface Server {
  start: () => Server,
  stop: () => Server
}

const NAMESPACE = 'solid-auth-client'

const namespace = (data: request | response): Object => ({
  [NAMESPACE]: data
})

const getNamespacedPayload = (eventData: mixed): ?Object => {
  if (!eventData || typeof eventData !== 'object') {
    return null
  }
  const payload = eventData[NAMESPACE]
  if (!payload || typeof payload !== 'object') {
    return null
  }
  return payload
}

const getResponse = (eventData: mixed): ?response => {
  const resp = getNamespacedPayload(eventData)
  if (!resp) {
    return null
  }
  const { id, ret } = resp
  return id != null && typeof id === 'string' && resp.hasOwnProperty('ret')
    ? { id, ret }
    : null
}

const getRequest = (eventData: mixed): ?request => {
  const req = getNamespacedPayload(eventData)
  if (!req) {
    return null
  }
  const { id, method, args } = req
  return id != null &&
  typeof id === 'string' &&
  typeof method === 'string' &&
  Array.isArray(args)
    ? { id, method, args }
    : null
}

export const client = (
  serverWindow: window,
  serverOrigin: string
) => (request: { method: string, args: any[] }): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reqId = uuid()
    const responseListener = event => {
      const { data, origin } = event
      const resp = getResponse(data)
      if (origin !== serverOrigin || !resp) {
        return
      }
      if (resp.id !== reqId) {
        return
      }
      resolve(resp.ret)
      window.removeEventListener('message', responseListener)
    }
    window.addEventListener('message', responseListener)
    serverWindow.postMessage(
      {
        'solid-auth-client': {
          id: reqId,
          method: request.method,
          args: request.args
        }
      },
      serverOrigin
    )
  })
}

export const server = (childWindow: window, childOrigin: string) => (
  handle: handler
): Server => {
  const messageListener = async (event: MessageEvent) => {
    const { data, origin } = event
    const req = getRequest(data)
    if (!req) {
      return
    }
    if (origin !== childOrigin) {
      console.warn(
        `SECURITY WARNING: solid-auth-client is listening for messages from ${childOrigin},` +
          ` but received a message from ${origin}.`
      )
      return
    }
    const resp = await handle(req)
    if (resp) {
      childWindow.postMessage(namespace(resp), childOrigin)
    }
  }
  const s = {
    start: () => {
      window.addEventListener('message', messageListener)
      return s
    },
    stop: () => {
      window.removeEventListener('message', messageListener)
      return s
    }
  }
  return s
}

export const combineHandlers = (...handlers: handler[]) => (
  req: request
): ?Promise<response> =>
  handlers.map(handler => handler(req)).find(promise => promise !== null)
