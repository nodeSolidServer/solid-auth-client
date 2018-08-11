/* global sessionStorage */
import React from 'react'
import ReactDOM from 'react-dom'

import { client } from '../src/ipc'
import { getData, updateStorage } from '../src/storage'

import OidcCallback from './components/OidcCallback'
import IdpSelect from './components/IdpSelect'
import NoParent from './components/NoParent'

import './index.css'

const defaultIdps = [
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
  const container = createAppContainer(appOrigin)
  ReactDOM.render(container, document.getElementById('app-container'))
})

function createAppContainer(appOrigin) {
  // Extract parameters from the current URL
  const { origin, host, hash } = new URL(window.location)
  const baseUrl = `${origin}/`
  const appName = process.env.APP_NAME.trim() || host
  const idpCallbackUri = hash.replace(/^#idpCallback=(.*)|.*/, '$1')

  // The login UI was not opened from a parent window or referrer
  if (!appOrigin && !idpCallbackUri) {
    return <NoParent appName={appName} />
  }

  // An OIDC callback returned to the login UI
  if (/^#access_token/.test(hash)) {
    return (
      <OidcCallback
        appOrigin={appOrigin}
        afterLoggedIn={() => setTimeout(window.close, 750)}
      />
    )
  }

  // Default mode: show the IDP selection UI
  const idps = [...defaultIdps]
  if (!idps.some(idp => idp.url === baseUrl)) {
    idps.unshift({
      displayName: host,
      url: baseUrl,
      iconUrl: baseUrl + 'favicon.ico'
    })
  }
  return (
    <IdpSelect
      idps={idps}
      appOrigin={appOrigin}
      appName={appName}
      idpCallbackUri={idpCallbackUri}
    />
  )
}

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
