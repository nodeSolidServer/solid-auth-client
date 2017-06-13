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
