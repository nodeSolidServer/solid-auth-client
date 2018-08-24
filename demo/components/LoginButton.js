// @flow
import React from 'react'

import auth from '../../src/'

const popupUri = process.env.POPUP_URI

export default class LoginButton extends React.Component<Object, Object> {
  constructor(props: {}) {
    super(props)
    auth.trackSession(session => this.setState({ loggedIn: !!session }))
  }

  render() {
    return this.state.loggedIn ? (
      <button onClick={() => auth.logout()}>Log out</button>
    ) : (
      <button onClick={() => auth.popupLogin({ popupUri })}>Log in</button>
    )
  }
}
