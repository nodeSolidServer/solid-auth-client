// @flow
import 'isomorphic-fetch'
import React from 'react'

import { fetch } from '../../src/'
import type { Session } from '../../src/session'

type Profile = {
  'foaf:name': ?{ '@value': string }
}

export default class PersonalInfo extends React.Component<Object, Object> {
  props: { session: ?Session }

  defaultProps = {
    session: null
  }

  state: { profile: Profile } = {
    profile: { 'foaf:name': null }
  }

  fetchProfile = (webId: string): Promise<Profile> => {
    const query = `
      @prefix foaf http://xmlns.com/foaf/0.1/
      ${webId} { foaf:name }
    `
    return fetch('https://databox.me/,query', {
      method: 'POST',
      body: query
    }).then(resp => resp.json())
  }

  saveProfile = (profile: Profile): void => this.setState({ profile })

  componentWillReceiveProps(props: { session: ?Session }) {
    if (props.session) {
      this.fetchProfile(props.session.webId).then(this.saveProfile)
    }
  }

  render() {
    const { session } = this.props
    const name = this.state.profile['foaf:name']
      ? this.state.profile['foaf:name']['@value']
      : 'unnamed person'
    return session ? (
      <div>
        Hey there, <span>{name}</span>! Your WebID is:{' '}
        <a href={session.webId} target="_blank">
          <code>{session.webId}</code>
        </a>
      </div>
    ) : null
  }
}
