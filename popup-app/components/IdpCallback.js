import React, { Component } from 'react'

import auth from '../../src'
import { Client } from '../../src/ipc'
import { postMessageStorage } from '../../src/storage'

export default class IdpCallback extends Component {
  state = { loggedIn: false }
  client = new Client(window.opener, this.props.appOrigin)

  postSession = async () => {
    const storage = postMessageStorage(window.opener, this.props.appOrigin)
    const session = await auth.currentSession(storage)
    await this.client.request('foundSession', session)
  }

  constructor(props) {
    super(props)
    this.postSession().then(() => {
      this.setState({ loggedIn: true })
    })
  }

  render() {
    return this.state.loggedIn ? <LoggedIn /> : <Loading />
  }

  componentDidUpdate() {
    const { afterLoggedIn } = this.props
    if (this.state.loggedIn) {
      afterLoggedIn()
    }
  }
}

const Loading = () => <h1 class="center">Logging in...</h1>

const LoggedIn = () => <h1 className="center">Logged in!</h1>
