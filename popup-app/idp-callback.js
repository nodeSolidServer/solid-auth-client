import { currentSession } from '../src/api'
import { html, render } from './html'
import { client } from '../src/ipc'
import { postMessageStorage } from '../src/storage'

import './common.css'

if (!process.env.TRUSTED_APP_ORIGIN) {
  throw new Error(
    'IDP Select App not provided with "process.env.TRUSTED_APP_ORIGIN".  Due to security reasons, cannot log in.'
  )
}
const request = client(window.opener, process.env.TRUSTED_APP_ORIGIN)

window.addEventListener('DOMContentLoaded', async () => {
  render(loadingUi(), '#app-container')
  const storage = postMessageStorage(
    window.opener,
    process.env.TRUSTED_APP_ORIGIN
  )
  const session = await currentSession(storage)
  await request({ method: 'foundSession', args: [session] })
  render(successUi(), '#app-container')
  setTimeout(window.close, 750)
})

const loadingUi = () =>
  html`
  <h1 class="center">
    Logging in...
  </h1>
  <div class="center">
    <i class="fa fa-circle-o-notch fa-spin fa-5x fa-fw" aria-hidden="true"></i>
  </div>
  `

const successUi = () =>
  html`
  <h1 class="center">
    Logged in!
  </h1>
  <div class="center">
    <i class="fa fa-check fa-5x" aria-hidden="true"></i>
  </div>
  `
