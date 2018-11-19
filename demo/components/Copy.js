// @flow
import React from 'react'

import auth from '../../src/'

export default class Copy extends React.Component<Object, Object> {
  componentWillMount() {
    auth.trackSession(session =>
      this.setState({ webId: session && session.webId })
    )
  }

  render() {
    const { webId } = this.state
    return (
      <p>
        This is a simple demo of the Solid Auth Client. You're currently
        {webId ? ' logged in' : ' anonymous'}.
      </p>
    )
  }
}
