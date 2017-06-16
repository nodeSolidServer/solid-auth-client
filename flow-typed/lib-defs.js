declare module 'auth-header' {
  declare export function parse (wwwAuthHeader: string): object;
}

declare module 'isomorphic-fetch' {}

declare module '@trust/oidc-rp' {
  declare export default class RelyingParty {
    provider : { url: string };
    static from (data: object): Promise<RelyingParty>;
    static register (issuer: string, registration: object, options: object): Promise<RelyingParty>;
    createRequest (options: object, storage: object): Promise<string>;
    serialize (): string;
    validateResponse (response: string, session: object): Promise<object>;
    logout (): Promise<void>;
  }
}
