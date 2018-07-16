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
        <img className="idp__icon" src={idp.iconUrl} alt="" />
      </span>
    </button>
  </div>
)

const Error = ({ error }) => <div className="error center">{error}</div>

export default IdpSelect
