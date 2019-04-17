import React, { Component } from 'react'

import SolidAuthClient from '../../src/solid-auth-client'
import { Client } from '../../src/ipc'
import { ipcStorage } from '../../src/storage'

export default class IdpCallback extends Component {
  state = { loggedIn: false }
  client = new Client(window.opener, this.props.appOrigin)

  async componentDidMount() {
    const asyncStorage = ipcStorage(this.client)
    const sessionId = await this.client.request('getSessionId')
    const authClient = SolidAuthClient.openSession(sessionId, asyncStorage)
    const session = await authClient.currentSession()
    await this.client.request('foundSession', session)
    this.setState({ loggedIn: true })
  }

  componentDidUpdate() {
    const { afterLoggedIn } = this.props
    if (this.state.loggedIn) {
      afterLoggedIn()
    }
  }

  render() {
    const message = this.state.loggedIn ? 'Logged in!' : 'Logging in…'
    return <h1 class="center">{message}</h1>
  }
}
