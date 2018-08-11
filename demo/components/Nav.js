// @flow
import React from 'react'

type propTypes = {
  loggedIn: boolean,
  onClickLogIn: (event: Event) => any,
  onClickLogOut: (event: Event) => any
}

const Nav = ({ loggedIn, onClickLogIn, onClickLogOut }: propTypes) => (
  <nav>
    <h1>Solid Auth Client Demo</h1>
    {loggedIn ? (
      <button onClick={onClickLogOut}>Log out</button>
    ) : (
      <button onClick={onClickLogIn}>Log in</button>
    )}
  </nav>
)

export default Nav
