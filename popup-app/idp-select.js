// @flow
import { login } from '../src/api'
import { postMessageStorage } from '../src/storage'

import './idp-select.css'

export type idp = {
  displayName: string,
  url: string,
  iconUrl: string
}

const idps: idp[] = [
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
const html = (literals: string[], ...substs) =>
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
const htmlEscape = (str: string): string =>
  str
    .replace(/&/g, '&amp;') // first!
    .replace(/>/g, '&gt;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;')

const idpsUI = (idps: idp[]): string =>
  idps.reduce(
    (_html, idp) =>
      _html +
      html`
      <section class="idp">
        <button type="button" class="idp__select" data-url=$${idp.url}>
          <h1>$${idp.displayName}</h1>
          <img src="$${idp.iconUrl}">
        </button>
      </section>
    `,
    ''
  )

let loginOptions = null
window.addEventListener('message', event => {
  try {
    const message = event.data
    if (message.loginOptions) {
      loginOptions = message.loginOptions
    }
  } catch (e) {
    loginOptions = null
  }
})

const container = document.getElementById('idp-list')
if (container) {
  container.innerHTML = idpsUI(idps)

  container.querySelectorAll('.idp__select').forEach(button => {
    button.addEventListener('click', async () => {
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
        storage: postMessageStorage(window.opener, window.location.origin)
      }
      const maybeSession = await login(button.dataset.url, loginOptions)
      if (typeof maybeSession === 'object') {
        window.opener.postMessage(
          {
            'solid-auth-client': {
              method: 'foundSession',
              args: [maybeSession]
            }
          },
          '*'
        )
        window.close()
      } else if (typeof maybeSession === 'function') {
        maybeSession()
      }
    })
  })
}
