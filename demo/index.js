// @flow
import React from 'react'
import ReactDOM from 'react-dom'

import 'bootstrap/dist/css/bootstrap.css'

import App from './components/App'

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
