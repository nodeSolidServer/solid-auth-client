import React, { Component } from 'react'

import auth from '../../src'
import { Client } from '../../src/ipc'
import { ipcStorage } from '../../src/storage'

export default class IdpCallback extends Component {
  state = { loggedIn: false }
  client = new Client(window.opener, this.props.appOrigin)

  async componentDidMount() {
    const storage = ipcStorage(this.client)
    const session = await auth.currentSession(storage)
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
