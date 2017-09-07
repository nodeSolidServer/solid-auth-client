/* global sessionStorage */
import React from 'react'
import ReactDOM from 'react-dom'

import { client } from '../src/ipc'
import { getData, updateStorage } from '../src/storage'

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

requestAppOrigin().then(appOrigin => {
  ReactDOM.render(
    window.location.hash ? (
      <IdpCallback
        appOrigin={appOrigin}
        afterLoggedIn={() => setTimeout(window.close, 750)}
      />
    ) : (
      <IdpSelect
        idps={idps}
        appOrigin={appOrigin}
        appName={process.env.TRUSTED_APP_NAME}
      />
    ),
    document.getElementById('app-container')
  )
})

async function requestAppOrigin() {
  let appOrigin = await getStoredAppOrigin()
  if (appOrigin) {
    return appOrigin
  }
  const request = client(window.opener, '*')
  appOrigin = await request({
    method: 'getAppOrigin',
    args: []
  })
  storeAppOrigin(appOrigin)
  return appOrigin
}

function getStoredAppOrigin() {
  return getData(sessionStorage).then(data => data.appOrigin)
}

function storeAppOrigin(origin) {
  return updateStorage(sessionStorage, data => ({
    ...data,
    appOrigin: origin
  })).appOrigin
}
