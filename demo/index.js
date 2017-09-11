// @flow
import React from 'react'
import ReactDOM from 'react-dom'

import 'bootstrap/dist/css/bootstrap.css'

import App from './components/App'

import * as SolidAuthClient from '../src'

// for demo/debug purposes
window.SolidAuthClient = SolidAuthClient
console.log('Welcome to the solid-auth-client demo!')
console.log(
  'Check out window.SolidAuthClient to explore the interface at the code level.'
)
console.log(
  'If you find a bug please file it at https://github.com/solid/solid-auth-client/issues/'
)

const container = document.createElement('div')
container.id = 'container'
container.className = 'container'
if (document.body) {
  document.body.appendChild(container)
}

ReactDOM.render(<App />, container)

if (
  module.hot &&
  module.hot.accept &&
  typeof module.hot.accept === 'function'
) {
  module.hot.accept('./components/App', () => {
    const App = require('./components/App').default
    ReactDOM.render(<App />, container)
  })
}
