import React from 'react'

import auth from '../../src'
import { Client } from '../../src/ipc'
import { ipcStorage, getData } from '../../src/storage'

import './IdpSelect.css'

class IdpSelect extends React.Component {
  state = {
    enteringCustomIdp: false,
    customIdp: { url: '' },
    error: null
  }

  toggleEnteringCustomIdp = () =>
    this.setState(currentState => ({
      enteringCustomIdp: !currentState.enteringCustomIdp
    }))

  handleChangeIdp = event => {
    let url = event.target.value
    // Auto-prepend https: if the user is not typing it
    if (!/^($|h$|ht)/.test(url)) url = `https://${url}`
    this.setState({ customIdp: { url } })
  }

  handleBlurIdp = event => {
    let url = event.target.value
    // Auto-prepend https: if not present
    if (!/^(https?:\/\/|$)/.test(url))
      url = url.replace(/^([a-z]*:\/*)?/, 'https://')
    this.setState({ customIdp: { url } })
  }

  handleSelectIdp = idp => async event => {
    event.preventDefault()
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
      ...(await this.getClient().request('getLoginOptions')),
      storage: this.getStorage()
    }
    await auth.login(idp.url, loginOptions)
  }

  getClient() {
    return new Client(window.opener, this.props.appOrigin)
  }

  getStorage() {
    return ipcStorage(this.getClient())
  }

  async componentDidMount() {
    const { rpConfig } = await getData(this.getStorage())
    if (rpConfig) {
      this.setState({ customIdp: { url: rpConfig.provider.url } })
    }
  }

  componentDidUpdate() {
    if (this.idpInput) {
      this.idpInput.focus()
    }
  }

  render() {
    const { appName, idps } = this.props
    const { customIdp, enteringCustomIdp, error } = this.state
    return (
      <div>
        <h1>
          Log in to <span className="app-name">{appName}</span>
        </h1>
        {error && <Error error={error} />}
        <p>Choose where you log in</p>
        {enteringCustomIdp && (
          <form
            className="custom-idp"
            onSubmit={this.handleSelectIdp(customIdp)}
          >
            <input
              ref={input => (this.idpInput = input)}
              type="url"
              placeholder="https://my-identity.provider"
              value={customIdp.url}
              onChange={this.handleChangeIdp}
              onBlur={this.handleBlurIdp}
            />
            <button type="submit">Log In</button>
            <button type="reset" onClick={this.toggleEnteringCustomIdp}>
              Cancel
            </button>
          </form>
        )}
        <div className="idp-list">
          <Idp
            idp={{ displayName: 'custom provider' }}
            handleSelectIdp={this.toggleEnteringCustomIdp}
          />
          {idps.map(idp => (
            <Idp
              idp={idp}
              handleSelectIdp={this.handleSelectIdp(idp)}
              key={idp.url}
            />
          ))}
        </div>
      </div>
    )
  }
}

const Idp = ({ idp, handleSelectIdp }) => (
  <button className="idp" onClick={handleSelectIdp}>
    {idp.displayName}
  </button>
)

const Error = ({ error }) => <p className="error">{error}</p>

export default IdpSelect
