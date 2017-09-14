import React from 'react'

const NoParent = ({ appName }) => (
  <div>
    <p>
      This window was opened to log you in to{' '}
      <span className="app-name">{appName}</span>, but that app is no longer
      open.
    </p>
    <p>
      If you're trying to log in to <span className="app-name">{appName}</span>,
      close this window, then go back to the app and log in again.
    </p>
    <p>If you opened this window by accident, close it.</p>
  </div>
)

export default NoParent
