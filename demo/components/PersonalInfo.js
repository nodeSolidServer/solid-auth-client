// @flow
import React from 'react'

import auth from '../../src/'

type Profile = {
  'foaf:name': ?{ '@value': string }
}

export default class PersonalInfo extends React.Component<Object, Object> {
  constructor(props: {}) {
    super(props)
    auth.trackSession(async session => {
      let webId, profile, name
      if (session) {
        webId = session.webId
        profile = await this.fetchProfile(webId)
        name = profile['foaf:name'] && profile['foaf:name']['@value']
      }
      this.setState({ webId, name })
    })
  }

  fetchProfile = (webId: string): Promise<Profile> => {
    const query = `
      @prefix foaf http://xmlns.com/foaf/0.1/
      ${webId} { foaf:name }
    `
    return auth
      .fetch('https://databox.me/,query', {
        method: 'POST',
        body: query
      })
      .then(resp => resp.json())
  }

  render() {
    const { webId, name } = this.state
    return webId ? (
      <div>
        Hey there, <span>{name}</span>! Your WebID is:{' '}
        <a href={webId} target="_blank">
          <code>{webId}</code>
        </a>
      </div>
    ) : null
  }
}
