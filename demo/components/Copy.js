import React from 'react'

import SolidAuthClient from '../../src/'

export default class Copy extends React.Component<Object, Object> {
  constructor(props) {
    super(props)
    SolidAuthClient.trackSession(session =>
      this.setState({ loggedIn: !!session })
    )
  }

  render() {
    const { loggedIn } = this.state
    return (
      <p>
        This is a simple demo of the Solid Auth Client. You're currently
        {loggedIn
          ? ' logged in'
          : ' anonymous. Click "Log in" to authenticate and see some information about yourself'}.
      </p>
    )
  }
}
