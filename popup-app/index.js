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

findAppOrigin().then(appOrigin => {
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
        appName={process.env.APP_NAME}
      />
    ),
    document.getElementById('app-container')
  )
})

async function findAppOrigin() {
  let appOrigin = await getStoredAppOrigin()
  if (appOrigin) {
    return appOrigin
  }
  const request = client(window.opener, '*')
  appOrigin = await request({
    method: 'getAppOrigin',
    args: []
  })
  await storeAppOrigin(appOrigin)
  return appOrigin
}

async function getStoredAppOrigin() {
  const { appOrigin } = await getData(sessionStorage)
  return appOrigin
}

function storeAppOrigin(origin) {
  return updateStorage(sessionStorage, data => ({
    ...data,
    appOrigin: origin
  }))
}
