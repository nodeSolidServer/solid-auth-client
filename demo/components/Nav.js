// @flow
import React from 'react'

type propTypes = {
  loggedIn: boolean,
  onClickLogIn: (event: Event) => any,
  onClickLogOut: (event: Event) => any
}

const Nav = ({ loggedIn, onClickLogIn, onClickLogOut }: propTypes) => (
  <nav className="navbar navbar-light bg-faded d-flex flex-row justify-content-between">
    <a className="navbar-brand" href="#">
      Solid Auth Client Demo
    </a>
    {loggedIn ? (
      <button className="btn btn-default" onClick={onClickLogOut}>
        Log out
      </button>
    ) : (
      <button className="btn btn-default" onClick={onClickLogIn}>
        Log in
      </button>
    )}
  </nav>
)

export default Nav
