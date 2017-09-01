import React from 'react'
import ReactDOM from 'react-dom'

import IdpCallback from './components/IdpCallback'
import IdpSelect from './components/IdpSelect'

import './index.css'

const idps = [
  {
    displayName: 'Databox',
    url: 'https://databox.me/',
    iconUrl: 'https://solidtest.space/favicon.ico'
  },
  {
    displayName: 'Solid Test Space',
    url: 'https://solidtest.space/',
    iconUrl: 'https://solidtest.space/favicon.ico'
  }
]

ReactDOM.render(
  window.location.hash ? (
    <IdpCallback afterLoggedIn={() => setTimeout(window.close, 750)} />
  ) : (
    <IdpSelect idps={idps} />
  ),
  document.getElementById('app-container')
)
