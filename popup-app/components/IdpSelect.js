import React from 'react'

import { login } from '../../src/api'
import { client } from '../../src/ipc'
import { postMessageStorage } from '../../src/storage'

import './IdpSelect.css'

const timeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((resolve, reject) => setTimeout(() => resolve(null), ms))
  ])

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
    event.preventDefault()

    const { appOrigin, idpCallbackUri } = this.props
    if (idpCallbackUri) {
      this.sendIdpChoice(idp, idpCallbackUri)
    } else {
      await this.loginViaOpener(idp, appOrigin)
    }
  }

  // The login UI was used to select an IDP only; reply with the selected IDP
  sendIdpChoice(idp, idpCallbackUri) {
    const returnUrl = new URL(idpCallbackUri)
    returnUrl.hash = `#solid-auth-client.idp=${idp.url}${returnUrl.hash || '#'}`
    window.location.href = returnUrl
  }

  // The login UI was used as a popup; continue logging in
  async loginViaOpener(idp, appOrigin) {
    if (!window.opener) {
      console.warn('No parent window')
      this.setState({
        error:
          "Couldn't find the application window.  " +
          'Try closing this popup window and logging in again.'
      })
      return
    }
    const request = client(window.opener, appOrigin)
    let loginOptions = await timeout(
      request({
        method: 'getLoginOptions',
        args: []
      }),
      2000
    )
    if (!loginOptions) {
      console.warn(
        'Cannot log in - have not yet received loginOptions from parent window'
      )
      this.setState({
        error:
          "Couldn't find the application window.  " +
          'Try closing this popup window and logging in again.'
      })
      return
    }
    loginOptions = {
      ...loginOptions,
      storage: postMessageStorage(window.opener, appOrigin)
    }
    await login(idp.url, loginOptions)
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
        <h1 className="center">
          Log in to <span className="app-name">{appName}</span>
        </h1>
        {error && <Error error={error} />}
        <p className="copy-gentle center">Choose where you log in</p>
        {enteringCustomIdp && (
          <form
            className="form-inline"
            onSubmit={this.handleSelectIdp(customIdp)}
          >
            <input
              ref={input => (this.idpInput = input)}
              className="form-inline__input-text"
              type="url"
              placeholder="https://my-identity.databox.me/profile/card#me"
              value={customIdp.url}
              onChange={this.handleChangeIdp}
            />
            <div className="form-inline__controls">
              <button className="btn" type="submit">
                Log In
              </button>
              <button
                className="btn"
                type="reset"
                onClick={this.toggleEnteringCustomIdp}
              >
                Cancel
              </button>
            </div>
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
  <div className="idp">
    <button className="idp__select" onClick={handleSelectIdp}>
      <span className="idp__copy">Log in with {idp.displayName}</span>
      <span className="idp__icon-container">
        {idp.iconUrl ? (
          <img className="idp__icon" src={idp.iconUrl} alt="" />
        ) : (
          <svg width="32" viewBox="0 0 100 20" alt="">
            <path d="M41.2,50c0-4.9,4-8.8,8.8-8.8s8.8,4,8.8,8.8c0,4.9-4,8.8-8.8,8.8S41.2,54.9,41.2,50z M80.3,41.2c-4.9,0-8.8,4-8.8,8.8 c0,4.9,4,8.8,8.8,8.8s8.8-4,8.8-8.8C89.2,45.1,85.2,41.2,80.3,41.2z M19.7,41.2c-4.9,0-8.8,4-8.8,8.8c0,4.9,4,8.8,8.8,8.8 s8.8-4,8.8-8.8C28.5,45.1,24.5,41.2,19.7,41.2z" />
          </svg>
        )}
      </span>
    </button>
  </div>
)

const Error = ({ error }) => <div className="error center">{error}</div>

export default IdpSelect
