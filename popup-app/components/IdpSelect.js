import React from 'react'

import SolidAuthClient from '../../src/solid-auth-client'
import { Client } from '../../src/ipc'
import { ipcStorage, StorageSession } from '../../src/storage'
import './IdpSelect.css'

export default class IdpSelect extends React.Component {
  state = { idp: '', error: null }

  handleChangeIdp = event => {
    let idp = event.target.value
    // Auto-prepend https: if the user is not typing it
    if (!/^($|h$|ht)/.test(idp)) idp = `https://${idp}`
    this.setState({ idp })
  }

  handleBlurIdp = event => {
    let idp = event.target.value
    // Auto-prepend https: if not present
    if (!/^(https?:\/\/|$)/.test(idp))
      idp = idp.replace(/^([a-z]*:\/*)?/, 'https://')
    this.setState({ idp })
  }

  handleSelectIdp = idp => async event => {
    event.preventDefault()
    this.setState({ idp })
    if (!window.opener) {
      console.warn('No parent window')
      this.setState({
        error:
          "Couldn't find the application window.  " +
          'Try closing this popup window and logging in again.'
      })
      return
    }
    const loginOptions = {
      ...(await this.getClient().request('getLoginOptions'))
    }
    const authSession = await this.getAuthClientSession()
    await authSession.login(idp, loginOptions)
  }

  getClient() {
    return new Client(window.opener, this.props.appOrigin)
  }

  getAsyncStorage() {
    return ipcStorage(this.getClient())
  }

  async getStorageSession() {
    const sessionId = await this.getClient().request('getSessionId')
    return new StorageSession(sessionId, this.getAsyncStorage())
  }

  async getAuthClientSession() {
    const sessionId = await this.getClient().request('getSessionId')
    return SolidAuthClient.openSession(sessionId, this.getAsyncStorage())
  }

  async componentDidMount() {
    const storage = await this.getStorageSession()
    const rpConfig = await storage.get('rpConfig')
    if (rpConfig) {
      this.setState({ idp: rpConfig.provider.url })
    }
    this.idpInput.focus()
  }

  render() {
    const { appName, idps } = this.props
    const { idp, error } = this.state
    return (
      <div>
        <h1>
          Log in to <span className="app-name">{appName}</span>
        </h1>
        {error && <p className="error">{error}</p>}
        <p>Please enter your WebID or the URL of your identity provider:</p>
        <form className="custom-idp" onSubmit={this.handleSelectIdp(idp)}>
          <input
            ref={input => (this.idpInput = input)}
            type="url"
            placeholder="https://my-identity.provider"
            value={idp}
            onChange={this.handleChangeIdp}
            onBlur={this.handleBlurIdp}
          />
          <button type="submit" disabled={!idp}>
            Go
          </button>
        </form>
        <p>Or pick an identity provider from the list below:</p>
        <div className="idp-list">
          {idps.map(idp => (
            <button
              className="idp"
              onClick={this.handleSelectIdp(idp.url)}
              key={idp.url}
            >
              {idp.displayName}
            </button>
          ))}
        </div>
      </div>
    )
  }
}
