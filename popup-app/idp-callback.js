// @flow
import { currentSession } from '../src/api'
import { client } from '../src/ipc'
import { postMessageStorage } from '../src/storage'

if (!process.env.TRUSTED_APP_ORIGIN) {
  throw new Error(
    'IDP Select App not provided with "process.env.TRUSTED_APP_ORIGIN".  Due to security reasons, cannot log in.'
  )
}
const request = client(window.opener, process.env.TRUSTED_APP_ORIGIN)

window.addEventListener('DOMContentLoaded', async () => {
  const storage = postMessageStorage(
    window.opener,
    process.env.TRUSTED_APP_ORIGIN || ''
  )
  const session = await currentSession(storage)
  await request({ method: 'foundSession', args: [session] })
  window.close()
})
