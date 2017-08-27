import { login } from '../src/api'
import { client } from '../src/ipc'
import { postMessageStorage } from '../src/storage'

import './common.css'
import './idp-select.css'

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

// from http://2ality.com/2015/01/template-strings-html.html
const html = (literals, ...substs) =>
  literals.raw.reduce((acc, lit, i) => {
    let subst = substs[i - 1]
    if (Array.isArray(subst)) {
      subst = subst.join('')
    }
    if (acc.endsWith('$')) {
      subst = htmlEscape(subst)
      acc = acc.slice(0, -1)
    }
    return acc + subst + lit
  })

// from http://2ality.com/2015/01/template-strings-html.html
const htmlEscape = str =>
  str
    .replace(/&/g, '&amp;') // first!
    .replace(/>/g, '&gt;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;')

const idpsUI = idps =>
  html`
  <h1 class="center">Log in to $${process.env.TRUSTED_APP_NAME}</h1>
  <p class="center copy-gentle">Choose where you log in</p>
  <div class="idp-list">
  ` +
  idps.reduce(
    (_html, idp) =>
      _html +
      html`
      <div class="idp">
        <button type="button" class="idp__select" data-url=$${idp.url}>
          <span class="idp__copy">Log in with $${idp.displayName}</span>
          <span class="idp__icon-container">
            <img class="idp__icon" src="$${idp.iconUrl}" alt="">
          </span>
        </button>
      </div>
    `,
    ''
  ) +
  html`</div>`

if (!process.env.TRUSTED_APP_ORIGIN) {
  throw new Error(
    'IDP Select App not provided with "process.env.TRUSTED_APP_ORIGIN".  Due to security reasons, cannot log in.'
  )
}
const request = client(window.opener, process.env.TRUSTED_APP_ORIGIN)

const container = document.getElementById('app-container')
if (container) {
  container.innerHTML = idpsUI(idps)

  container.querySelectorAll('.idp__select').forEach(button => {
    button.addEventListener('click', async () => {
      let loginOptions = await request({
        method: 'getLoginOptions',
        args: []
      })
      if (!loginOptions) {
        console.warn(
          'Cannot log in - have not yet received loginOptions from parent window'
        )
        return
      }
      const { url } = button.dataset
      if (!url) {
        console.error('IDP button missing `data-url` attribute')
        return
      }
      loginOptions = {
        ...loginOptions,
        storage: postMessageStorage(
          window.opener,
          process.env.TRUSTED_APP_ORIGIN
        )
      }
      const maybeSession = await login(button.dataset.url, loginOptions)
      if (typeof maybeSession === 'object') {
        await request({ method: 'foundSession', args: [maybeSession] })
        window.close()
      } else if (typeof maybeSession === 'function') {
        maybeSession()
      }
    })
  })
}
