// @flow
import { currentSession } from '../src/api'
import { postMessageStorage } from '../src/storage'

window.addEventListener('DOMContentLoaded', async () => {
  // TODO: fix this security bug!!
  const storage = postMessageStorage(window.opener, window.location.origin)
  const session = await currentSession(storage)
  window.opener.postMessage(
    {
      'solid-auth-client': {
        method: 'foundSession',
        args: [session]
      }
    },
    window.opener.location.origin
  )
  window.close()
})
