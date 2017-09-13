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
    const maybeSession = await login(idp.url, loginOptions)
    if (typeof maybeSession === 'object') {
      await request({ method: 'foundSession', args: [maybeSession] })
      window.close()
    } else if (typeof maybeSession === 'function') {
      maybeSession()
    }
  }

  render() {
    const { appName, idps } = this.props
    const { customIdp, enteringCustomIdp, error } = this.state
    return (
      <div>
        <h1 className="center">Log in to {appName}</h1>
        {error && <Error error={error} />}
        <p className="copy-gentle center">Choose where you log in</p>
        {enteringCustomIdp ? (
          <form
            className="form-inline"
            onSubmit={this.handleSelectIdp(customIdp)}
          >
            <input
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
        ) : (
          <button
            className="btn btn-link"
            onClick={this.toggleEnteringCustomIdp}
          >
            Choose a custom Solid account
          </button>
        )}
        <div className="idp-list">
          {idps.map(idp => (
            <Idp
              idp={idp}
              handleSelectIdp={this.handleSelectIdp}
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
    <button className="idp__select" onClick={handleSelectIdp(idp)}>
      <span className="idp__copy">Log in with {idp.displayName}</span>
      <span className="idp__icon-container">
        <img className="idp__icon" src={idp.iconUrl} alt="" />
      </span>
    </button>
  </div>
)

const Error = ({ error }) => <div className="error center">{error}</div>

export default IdpSelect
