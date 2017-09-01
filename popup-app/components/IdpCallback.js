import React, { Component } from 'react'

import { currentSession } from '../../src/api'
import { client } from '../../src/ipc'
import { postMessageStorage } from '../../src/storage'

const request = client(window.opener, process.env.TRUSTED_APP_ORIGIN)

const postSession = async () => {
  const storage = postMessageStorage(
    window.opener,
    process.env.TRUSTED_APP_ORIGIN
  )
  const session = await currentSession(storage)
  await request({ method: 'foundSession', args: [session] })
}

export default class IdpCallback extends Component {
  state = { loggedIn: false }

  constructor(props) {
    super(props)
    postSession().then(() => {
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
