declare module 'auth-header' {
  declare export function parse(wwwAuthHeader: string): Object
}

declare module '@solid/oidc-rp' {
  declare export default class RelyingParty {
    provider: { url: string },
    registration: { redirect_uris: Array<String> },
    static from(data: Object): Promise<RelyingParty>,
    static register(
      issuer: string,
      registration: Object,
      options: Object
    ): Promise<RelyingParty>,
    createRequest(options: Object, storage: Object): Promise<string>,
    serialize(): string,
    validateResponse(response: string, session: Object): Promise<Object>,
    logout(): Promise<void>
  }
}
