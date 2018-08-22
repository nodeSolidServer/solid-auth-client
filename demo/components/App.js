// @flow
import 'isomorphic-fetch'
import React from 'react'

import Copy from './Copy'
import Nav from './Nav'
import PersonalInfo from './PersonalInfo'
import Footer from './Footer'

import type { Session } from '../../src/session'
import SolidAuthClient from '../../src/'

export default class App extends React.Component<Object, Object> {
  state: { session: ?Session } = { session: null }

  saveCredentials = (session: Session): void => {
    this.setState({ session })
  }

  onClickLogIn = () =>
    SolidAuthClient.popupLogin({
      popupUri: process.env.POPUP_URI
    }).then(this.saveCredentials)

  onClickLogOut = () =>
    SolidAuthClient.logout().then(() => {
      this.setState({ session: null })
    })

  constructor(props: {}) {
    super(props)
    SolidAuthClient.currentSession().then(this.saveCredentials)
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
