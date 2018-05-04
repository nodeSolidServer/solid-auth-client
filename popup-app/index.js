/* global sessionStorage */
import React from 'react'
import ReactDOM from 'react-dom'

import { client } from '../src/ipc'
import { getData, updateStorage } from '../src/storage'

import IdpCallback from './components/IdpCallback'
import IdpSelect from './components/IdpSelect'
import NoParent from './components/NoParent'

import './index.css'

const idps = [
  {
    displayName: 'Solid Community',
    url: 'https://solid.community/',
    iconUrl: 'https://solidtest.space/favicon.ico'
  },
  {
    displayName: 'Solid Test Space',
    url: 'https://solidtest.space/',
    iconUrl: 'https://solidtest.space/favicon.ico'
  }
]

findAppOrigin().then(appOrigin => {
  const appName = process.env.APP_NAME

  let element
  if (!appOrigin) {
    element = <NoParent appName={appName} />
  } else if (window.location.hash) {
    element = (
      <IdpCallback
        appOrigin={appOrigin}
        afterLoggedIn={() => setTimeout(window.close, 750)}
      />
    )
  } else {
    element = <IdpSelect idps={idps} appOrigin={appOrigin} appName={appName} />
  }

  ReactDOM.render(element, document.getElementById('app-container'))
})

async function findAppOrigin() {
  if (!window.opener) {
    return null
  }
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
