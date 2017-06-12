// @flow
import React from 'react'

import TextForm from './TextForm'

type propTypes = {
  loggedIn: boolean,
  choosingProvider: boolean,
  onClickLogIn: (event: Event) => any,
  onClickCancelLogin: (event: Event) => any,
  onSubmitIdp: (event: Event) => any,
  onClickLogOut: (event: Event) => any
}

const Nav = ({loggedIn, choosingProvider, onClickLogIn, onClickCancelLogin, onSubmitIdp, onClickLogOut }: propTypes) =>
  <nav className='navbar navbar-light bg-faded d-flex flex-row justify-content-between'>
    <a className='navbar-brand' href='#'>Solid Auth Client Demo</a>
    {loggedIn
      ? <button className='btn btn-default' onClick={onClickLogOut}>Log out</button>
      : choosingProvider
        ? <TextForm
          label='Choose an Identity Provider'
          onCancel={onClickCancelLogin}
          onSubmit={onSubmitIdp}
          />
        : <button className='btn btn-default' onClick={onClickLogIn}>Log in</button>
    }
  </nav>

export default Nav
