// @flow
import React from 'react'

import auth from '../../src/'

export default class PersonalInfo extends React.Component<Object, Object> {
  componentWillMount() {
    auth.trackSession(session =>
      this.setState({ webId: session && session.webId })
    )
  }

  render() {
    const { webId } = this.state
    return webId ? (
      <p>
        Your WebID is{' '}
        <a href={webId} target="_blank">
          <code>{webId}</code>
        </a>
        .
      </p>
    ) : null
  }
}
