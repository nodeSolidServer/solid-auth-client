import React from 'react'

import { login } from '../../src/api'
import { client } from '../../src/ipc'
import { postMessageStorage } from '../../src/storage'

import './IdpSelect.css'

const handleSelectIdp = idp => async event => {
  event.preventDefault()
  const request = client(window.opener, process.env.TRUSTED_APP_ORIGIN)
  let loginOptions = await request({
    method: 'getLoginOptions',
    args: []
  })
  if (!loginOptions) {
    console.warn(
      'Cannot log in - have not yet received loginOptions from parent window'
    )
    return
  }
  loginOptions = {
    ...loginOptions,
    storage: postMessageStorage(window.opener, process.env.TRUSTED_APP_ORIGIN)
  }
  const maybeSession = await login(idp.url, loginOptions)
  if (typeof maybeSession === 'object') {
    await request({ method: 'foundSession', args: [maybeSession] })
    window.close()
  } else if (typeof maybeSession === 'function') {
    maybeSession()
  }
}

const IdpSelect = ({ appName, idps }) => (
  <div>
    <h1 className="center">Log in to {appName}</h1>
    <p className="copy-gentle center">Choose where you log in</p>
    <div className="idp-list">
      {idps.map(idp => <Idp idp={idp} key={idp.url} />)}
    </div>
  </div>
)

const Idp = ({ idp }) => (
  <div className="idp">
    <button className="idp__select" onClick={handleSelectIdp(idp)}>
      <span className="idp__copy">Log in with {idp.displayName}</span>
      <span className="idp__icon-container">
        <img className="idp__icon" src={idp.iconUrl} alt="" />
      </span>
    </button>
  </div>
)

export default IdpSelect
