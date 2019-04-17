// @flow
/* globalRequest, Response, URL */
import { StorageSession, SESSION_KEY, HOSTS_KEY } from './storage'
import * as WebIdOidc from './webid-oidc'

export type host = {
  url: string,
  requiresAuth: boolean
}

export async function getHost(
  storage: StorageSession,
  url: string
): Promise<?host> {
  const { host } = new URL(url)
  const session = await storage.get(SESSION_KEY)
  if (session && host === new URL(session.idp).host) {
    return { url: host, requiresAuth: true }
  }
  const hosts = await storage.get(HOSTS_KEY)
  return hosts && hosts[host]
}

export async function saveHost(
  storage: StorageSession,
  { url, requiresAuth }: host
): Promise<void> {
  const oldHosts = await storage.get(HOSTS_KEY)
  const hosts = {
    ...oldHosts,
    [url]: { requiresAuth }
  }
  await storage.set(HOSTS_KEY, hosts)
}

export async function updateHostFromResponse(
  storage: StorageSession,
  resp: Response
): Promise<void> {
  if (WebIdOidc.requiresAuth(resp)) {
    const { host } = new URL(resp.url)
    await saveHost(storage, { url: host, requiresAuth: true })
  }
}
