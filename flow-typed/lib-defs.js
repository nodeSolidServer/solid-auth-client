declare module 'oidc-rp' {
  declare export default class RelyingParty {
    static from (data: object): Promise<RelyingParty>;
    static register (issuer: string, registration: object, options: object): Promise<RelyingParty>;
    createRequest (options: object, storage: object): Promise<string>;
    serialize (): string;
  }
}

declare module 'isomorphic-fetch' {}
