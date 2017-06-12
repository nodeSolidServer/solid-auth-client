// @flow
import React from 'react'

import Nav from './Nav'

import type { authResponse } from '../../src/api'
import type { session } from '../../src/session'
import { login, logout, currentSession } from '../../src/'

export default class App extends React.Component {
  state : {
    session: ?session,
    choosingProvider: boolean
  } = {
    session: null,
    choosingProvider: false
  }

  fetch: fetch

  saveCredentials = ({ session, fetch }: authResponse): void => {
    this.setState({ session })
    this.fetch = fetch
  }

  onClickLogIn = (event: Event) =>
    this.setState({ choosingProvider: true })

  onClickCancelLogin = (event: Event) =>
    this.setState({ choosingProvider: false })

  onSubmitIdp = (idp: string) => {
    login(idp.trim()).then(this.saveCredentials)
  }

  onClickLogOut = (event: Event) =>
    logout()
      .then(() => {
        this.setState({ session: null })
      })

  constructor (props: {}) {
    super(props)
    currentSession()
      .then(this.saveCredentials)
      .then(() => { window.location.hash = '' })
  }

  render () {
    const loggedIn = this.state.session !== null
    return (
      <div>
        <Nav
          loggedIn={loggedIn}
          choosingProvider={this.state.choosingProvider}
          onClickLogIn={this.onClickLogIn}
          onClickCancelLogin={this.onClickCancelLogin}
          onSubmitIdp={this.onSubmitIdp}
          onClickLogOut={this.onClickLogOut}
        />
        <div>
          This is a simple demo of the Solid Auth Client.  You're currently
          {loggedIn ? ' logged in' : ' anonymous. Click "Log in" to authenticate and see some information about yourself'}.
        </div>
      </div>
    )
  }
}
