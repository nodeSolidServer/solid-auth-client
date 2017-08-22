// @flow
import 'isomorphic-fetch'
import React from 'react'

import Copy from './Copy'
import Nav from './Nav'
import PersonalInfo from './PersonalInfo'
import Footer from './Footer'

import type { session } from '../../src/session'
import { popupLogin, logout, currentSession } from '../../src/'

export default class App extends React.Component {
  state: {
    session: ?session
  } = {
    session: null
  }

  saveCredentials = (session: session): void => {
    this.setState({ session })
  }

  onClickLogIn = (event: Event) =>
    popupLogin({
      idpSelectUri: 'http://localhost:8081/idp-select.html',
      redirectUri: 'http://localhost:8081/idp-callback.html'
    }).then(this.saveCredentials)

  onClickLogOut = (event: Event) =>
    logout().then(() => {
      this.setState({ session: null })
    })

  constructor(props: {}) {
    super(props)
    currentSession().then(this.saveCredentials)
  }

  render() {
    const loggedIn = this.state.session !== null
    return (
      <div>
        <Nav
          loggedIn={loggedIn}
          onClickLogIn={this.onClickLogIn}
          onClickLogOut={this.onClickLogOut}
        />
        <Copy loggedIn={loggedIn} />
        <PersonalInfo session={this.state.session} />
        <Footer />
      </div>
    )
  }
}
