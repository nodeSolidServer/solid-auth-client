// @flow

export type webIdOidcSession = {
  idp: string,
  webId: string,
  accessToken: string,
  idToken: string,
  clientId: string,
  sessionKey: string
}

export type Session = webIdOidcSession
