import React from 'react'

import auth from '../../src'
import { Client } from '../../src/ipc'
import { ipcStorage } from '../../src/storage'

import './IdpSelect.css'

class IdpSelect extends React.Component {
  state = {
    enteringCustomIdp: false,
    customIdp: { url: '' },
    error: null
  }

  toggleEnteringCustomIdp = () =>
    this.setState(currentState => ({
      enteringCustomIdp: !currentState.enteringCustomIdp,
      customIdp: { url: '' }
    }))

  handleChangeIdp = event => {
    this.setState({ customIdp: { url: event.target.value } })
  }

  handleSelectIdp = idp => async event => {
    const { appOrigin } = this.props
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
    const client = new Client(window.opener, appOrigin)
    const loginOptions = {
      ...(await client.request('getLoginOptions')),
      storage: ipcStorage(client)
    }
    await auth.login(idp.url, loginOptions)
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
              placeholder="https://my-identity.databox.me/profile/card#me"
              value={customIdp.url}
              onChange={this.handleChangeIdp}
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
    <span class="label">Log in with {idp.displayName}</span>
    {idp.iconUrl ? (
      <img className="icon" src={idp.iconUrl} alt="" />
    ) : (
      <svg className="icon" width="32" viewBox="0 0 100 20" alt="">
        <path d="M41.2,50c0-4.9,4-8.8,8.8-8.8s8.8,4,8.8,8.8c0,4.9-4,8.8-8.8,8.8S41.2,54.9,41.2,50z M80.3,41.2c-4.9,0-8.8,4-8.8,8.8 c0,4.9,4,8.8,8.8,8.8s8.8-4,8.8-8.8C89.2,45.1,85.2,41.2,80.3,41.2z M19.7,41.2c-4.9,0-8.8,4-8.8,8.8c0,4.9,4,8.8,8.8,8.8 s8.8-4,8.8-8.8C28.5,45.1,24.5,41.2,19.7,41.2z" />
      </svg>
    )}
  </button>
)

const Error = ({ error }) => <p className="error">{error}</p>

export default IdpSelect
