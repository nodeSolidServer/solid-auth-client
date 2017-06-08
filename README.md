# solid-auth-client

Opaquely authenticates solid clients

## About

Solid currently supports two cross-origin authentication protocols,
[WebID-TLS](https://www.w3.org/2005/Incubator/webid/spec/tls/) and
[WebID-OIDC](https://github.com/solid/webid-oidc-spec).

This library abstracts away the implementation details of these specs so that
clients don't have to handle different authentication protocols.

## API

*This API doc uses [flow](https://flow.org/) type annotations for clarity.
They're just here to show you the types of arguments expected by exported
functions.  You don't have to know anything about flow.*

### `login`

```js
login (idp: string, {
  redirectUri?: string,
  storage?: Storage
}): Promise<[string?, fetch]>
```

Authenticates the user with their IDP (identity provider) and promises an array
containing the user's WebID and a `fetch` function.

When the user is successfully authenticated, the WebID will be bound to a
non-empty string and the `fetch` function (same API as [whatwg
fetch](https://fetch.spec.whatwg.org/)) can be used to request any resource on
the web, passing credentials when necessary.

When the user is not found on the IDP, the WebID will be `null`.

If there's an error during the auth handshake, the Promise will reject.

Options:
- `redirectUri` (default current window location): a URI to be redirected back to with credentials for auth flows which involve redirects
- `storage`: An object implementing the storage interface for persisting credentials.

### `currentUser`

```js
currentUser (idp: string): Promise<[string?, fetch]>
```

Finds the current user for the given IDP, and returns their WebID and `fetch`
function, if their session is still active.

### `logout`

```js
logout (idp: string): void
```

Clears the user session with the given IDP.
