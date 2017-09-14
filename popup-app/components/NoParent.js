import React from 'react'

const NoParent = ({ appName }) => (
  <div>
    This window was opened to log you in to{' '}
    <span className="app-name">{appName}</span>, but that app is no longer open.
    You can close this window.
  </div>
)

export default NoParent
