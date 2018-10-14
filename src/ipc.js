// @flow

/*
  This module describes a simple IPC interface for communicating between browser windows.
  window.postMessage() is the transport interface, and a request/response interface
  is defined on top of it as follows:

  const request = {
    'solid-auth-client': {
      id: 1234,
      method: 'doSomethingPlease',
      args: [ 'one', 'two', 'three' ]
    }
  }

  const response = {
    'solid-auth-client': {
      id: 1234,
      ret: 'the_value'
    }
  }
*/

type handler = (string, ...args: any[]) => ?Promise<any>

const NAMESPACE = 'solid-auth-client'

/**
 * Receives and handles remote procedure calls.
 */
export class Server {
  _clientWindow: window
  _clientOrigin: string
  _handler: handler
  _messageListener: MessageEvent => Promise<void>

  constructor(clientWindow: window, clientOrigin: string, handle: handler) {
    this._clientWindow = clientWindow
    this._clientOrigin = clientOrigin
    this._handler = handle
    this._messageListener = event => this._handleMessage(event)
  }

  async _handleMessage({ data, origin }: MessageEvent) {
    // Ensure we can post to the origin
    if (origin !== this._clientOrigin) {
      console.warn(
        `solid-auth-client is listening to ${this._clientOrigin} ` +
          `so ignored a message received from ${origin}.`
      )
      return
    }

    // Parse the request and send it to the handler
    const req = data && (data: any)[NAMESPACE]
    if (req && req.method) {
      const { id, method, args } = (req: any)
      const ret = await this._handler(method, ...args)
      this._clientWindow.postMessage(
        { [NAMESPACE]: { id, ret } },
        this._clientOrigin
      )
    }
  }

  start() {
    window.addEventListener('message', this._messageListener)
  }

  stop() {
    window.removeEventListener('message', this._messageListener)
  }
}

/**
 * Makes remote procedure calls.
 */
export class Client {
  _serverWindow: window
  _serverOrigin: string

  constructor(serverWindow: window, serverOrigin: string) {
    this._serverWindow = serverWindow
    this._serverOrigin = serverOrigin
  }

  request(method: string, ...args: any[]): Promise<any> {
    // Send the request as a message to the server window
    const id = Math.random()
    this._serverWindow.postMessage(
      { [NAMESPACE]: { id, method, args } },
      this._serverOrigin
    )

    // Create a promise that resolves to the request's return value
    return new Promise((resolve, reject) => {
      // Listen for responses to the request
      window.addEventListener('message', responseListener)

      // Cancel if the response takes too long
      const timeout = setTimeout(() => {
        reject(new Error('Could not connect to main window.'))
        window.removeEventListener('message', responseListener)
      }, 2000)

      // Processes a possible response to the request
      function responseListener({ data }) {
        const resp = data && data[NAMESPACE]
        if (resp && resp.id === id && resp.hasOwnProperty('ret')) {
          resolve(resp.ret)
          clearTimeout(timeout)
          window.removeEventListener('message', responseListener)
        }
      }
    })
  }
}
