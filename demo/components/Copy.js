import React from 'react'

const Copy = ({ loggedIn }: { loggedIn: boolean }) => (
  <p>
    This is a simple demo of the Solid Auth Client. You're currently
    {loggedIn
      ? ' logged in'
      : ' anonymous. Click "Log in" to authenticate and see some information about yourself'}.
  </p>
)

export default Copy
