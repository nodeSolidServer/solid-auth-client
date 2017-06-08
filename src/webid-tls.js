// @flow

export const login = (idp: string): Promise<string> =>
  fetch(idp, { method: 'OPTIONS', credentials: 'include' })
    .then(resp => resp.headers.get('user'))
