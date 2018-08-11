import React, { Component } from 'react'

import { currentSession } from '../../src/api'
import { client } from '../../src/ipc'
import { postMessageStorage } from '../../src/storage'

export default class OidcCallback extends Component {
  state = { loggedIn: false }

  request = client(window.opener, this.props.appOrigin)

  postSession = async () => {
    const storage = postMessageStorage(window.opener, this.props.appOrigin)
    const session = await currentSession(storage)
    return this.request({ method: 'foundSession', args: [session] })
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
