/* global sessionStorage */
import React from 'react'
import ReactDOM from 'react-dom'

import { Client } from '../src/ipc'
import { getData, updateStorage } from '../src/storage'

import IdpCallback from './components/IdpCallback'
import IdpSelect from './components/IdpSelect'
import NoParent from './components/NoParent'

import defaultIdps from './idps.json'

import './index.css'

findAppOrigin()
  .then(appOrigin => {
    const baseUrl = window.location.href.replace(/(\/\/[^/]*\/).*/, '$1')
    const host = baseUrl.replace(/^[^:]+:|\//g, '')
    const appName = process.env.APP_NAME.trim() || host

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
      const idps = [...defaultIdps]
      if (!idps.some(idp => idp.url === baseUrl)) {
        idps.unshift({ displayName: host, url: baseUrl })
      }
      element = (
        <IdpSelect idps={idps} appOrigin={appOrigin} appName={appName} />
      )
    }

    ReactDOM.render(element, document.getElementById('app-container'))
  })
  .catch(error => {
    window.alert(error)
    window.close()
  })

async function findAppOrigin() {
  if (!window.opener) {
    return null
  }
  let appOrigin = await getStoredAppOrigin()
  if (appOrigin) {
    return appOrigin
  }
  const client = new Client(window.opener, '*')
  appOrigin = await client.request('getAppOrigin')
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
