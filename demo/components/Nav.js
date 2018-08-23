// @flow
import React from 'react'

import SolidAuthClient from '../../src/'

export default class Nav extends React.Component<Object, Object> {
  constructor(props: {}) {
    super(props)
    SolidAuthClient.trackSession(session =>
      this.setState({ loggedIn: !!session })
    )
  }

  login() {
    SolidAuthClient.popupLogin({
      popupUri: process.env.POPUP_URI
    })
  }

  logout() {
    SolidAuthClient.logout()
  }

  render() {
    const { loggedIn } = this.state
    return (
      <nav>
        <h1>Solid Auth Client Demo</h1>
        {loggedIn ? (
          <button onClick={this.logout}>Log out</button>
        ) : (
          <button onClick={this.login}>Log in</button>
        )}
      </nav>
    )
  }
}
