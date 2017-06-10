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

### types

```
type session =
  { idp: string
  , webId: string
  , accessToken?: string
  , idToken?: string
  }

type authResponse =
  { session: ?session
  , fetch: fetchApi
  }
```

### `login`

```
login (idp: string, {
  redirectUri?: string,
  storage?: Storage
}): Promise<authResponse>
```

Authenticates the user with their IDP (identity provider) and promises an object
containing the user's session and a `fetch` function.

When the user is successfully authenticated, the session will be non-null and
the `fetch` function (same API as [whatwg
fetch](https://fetch.spec.whatwg.org/)) can be used to request any resource on
the web, passing credentials when necessary.

When the user is not found from the IDP, the session will be `null`, and the
`fetch` will be a plain old fetch.

If there's an error during the auth handshake, the Promise will reject.

Options:
- `redirectUri` (default current window location): a URI to be redirected back to with credentials for auth flows which involve redirects
- `storage`: An object implementing the storage interface for persisting credentials.

### `currentUser`

```
currentUser (idp: string, { storage?: Storage }): Promise<authResponse>
```

Finds the current user for the given IDP, and returns their session and `fetch`
function, if their session is still active, otherwise `null` and a regular
fetch.

### `logout`

```
logout (idp: string, { storage?: Storage }): Promise<void>
```

Clears the user session with the given IDP.

Note: this is an unsupported use case in WebID-TLS.  Once your browser provides
its client cert to a web server, there's no going back!  So for WebID-TLS, the
only thing this will do is clear the session from the store.
