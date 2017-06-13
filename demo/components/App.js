// @flow
import 'isomorphic-fetch'
import React from 'react'

import Copy from './Copy'
import Nav from './Nav'
import PersonalInfo from './PersonalInfo'
import Footer from './Footer'

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

  fetch = fetch

  saveCredentials = ({ session, fetch }: authResponse): void => {
    this.setState({ session })
    this.fetch = fetch
  }

  onClickLogIn = (event: Event) =>
    this.setState({ choosingProvider: true })

  onClickCancelLogin = () =>
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
    currentSession().then(this.saveCredentials)
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
        <Copy loggedIn={loggedIn} />
        <PersonalInfo session={this.state.session} fetch={this.fetch} />
        <Footer />
      </div>
    )
  }
}
