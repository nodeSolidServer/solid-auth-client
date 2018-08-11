// @flow
import React from 'react'

type propTypes = {
  loggedIn: boolean,
  onClickLogIn: (event: Event) => any,
  onClickLogInPopup: (event: Event) => any,
  onClickLogOut: (event: Event) => any
}

const Nav = ({
  loggedIn,
  onClickLogIn,
  onClickLogInPopup,
  onClickLogOut
}: propTypes) => (
  <nav>
    <h1>Solid Auth Client Demo</h1>
    {loggedIn ? (
      <button onClick={onClickLogOut}>Log out</button>
    ) : (
      [
        <button onClick={onClickLogIn}>Log in</button>,
        <button onClick={onClickLogInPopup}>
          Log in <em>(popup)</em>
        </button>
      ]
    )}
  </nav>
)

export default Nav
