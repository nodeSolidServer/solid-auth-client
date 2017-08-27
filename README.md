# solid-auth-client

[![Build Status](https://travis-ci.org/solid/solid-auth-client.svg?branch=master)](https://travis-ci.org/solid/solid-auth-client)
[![Coverage Status](https://coveralls.io/repos/github/solid/solid-auth-client/badge.svg?branch=master)](https://coveralls.io/github/solid/solid-auth-client?branch=master)

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
type webIdTlsSession = {
  authType: WebIdTls,
  idp: string,
  webId: string
}

type webIdOidcSession = {
  authType: WebIdOidc,
  idp: string,
  webId: string,
  accessToken: string,
  idToken: string
}

type session = webIdTlsSession | webIdOidcSession
```

### `login`

```
login (idp: string, {
  callbackUri?: string,
  storage?: Storage
}): Promise<?session | ?redirectFn>
```

Authenticates the user with their IDP (identity provider) and promises an object
containing the user's session.

When the user is successfully authenticated, the session will be non-null.  When
the user is not authenticated by the IDP, the session will be `null`.

Auth flows like OIDC require the user to give consent on their identity
provider.  In such cases, this function will return _a function which
redirects the user to their auth provider_, so as not to break the promise.
All you have to do is call that function in order to send the user on their
way.  Then, call `currentSession` when the user gives consent and lands back
in your app.

If you're using an auth flow with redirections, and don't want to take the
user away from your app, consider using the [popup workflow](#Using-the-popup-
login-flow).

If there's an error during the auth handshake, the Promise will reject.

Options:
- `callbackUri` (default current window location): a URI to be redirected back
  to with credentials for auth flows which involve redirects
- `storage`: An object implementing the storage interface for persisting
  credentials.  `localStorage` is the default in the browser.

### `popupLogin`

```
popupLogin({
  callbackUri: ?string,
  idpSelectUri: ?string,
  storage: AsyncStorage
}): Promise<?session>
```

Logs the user in using a popup window so that your app doesn't lose state.
See [Using the popup login flow](#Using-the-popup-login-flow).

### `currentSession`

```
currentSession (storage?: Storage): Promise<?session>
```

Finds the current session, and returns it if it is still active, otherwise
`null`.

### `logout`

```
logout (storage?: Storage): Promise<void>
```

Clears the active user session.

WARNING: this is an unsupported use case in WebID-TLS.  Once your browser
provides its client cert to a web server, there's no going back!  So for
WebID-TLS, the only thing this will do is clear the session from the store.

### `fetch`

Fetches a resource from the web.  Same API as
[fetch](https://fetch.spec.whatwg.org/), but retries with credentials when it
encounters a `401` with a `WWW-Authenticate` header which matches a recognized
authenticate scheme.

```
fetch: (url: RequestInfo, options?: Object) => Promise<Response>
```

## Using the popup login flow

If you want to offer a login experience that doesn't redirect away from your
app, you should use the popup login flow, which works as follows:

1. When prompted to log in, the app opens a popup window for the user to
   select their IDP
2. Within the popup, the the user is sent to their IDP
3. Within the popup, now at the IDP, the user logs in
3. Within the popup, the IDP sends the user back to the callback URI, which
   captures the user credentials
4. Within the popup, the callback URI app sends the credentials back to the
   main app window
5. The popup closes once the app receives the credentials

It's essential that the applications for selecting an IDP and capturing
credentials runs on a *trusted domain*, since the IDP select app needs to be
trusted to send the user to the right place(s), and the callback app needs to
be trusted to handle user credentials.  The best way to do this is to serve
these apps from a domain that you control.  For example, if your app is
located at https://example.com, consider deploying the idp select app to
https://auth.example.com/idp-select and the callback app to
https://auth.example.com/idp-callback.

### Building the popup apps

In order to use the popup login flow, you will have to generate static builds
of the idp select and idp callback apps so that those apps only communicate to
your trusted app origin.

#### Clone the repo

```sh
$ git clone https://github.com/solid/solid-auth-client.git
$ cd solid-auth-client
```

#### Install the dependencies

```sh
$ npm i
```

#### Create and edit your `.env` file

```sh
$ cp .env.example .env
$ $EDITOR .env # change the value of TRUSTED_APP_ORIGIN to your actual app origin
```

#### Build the app
```sh
$ npm run build:popup # done! your apps are in ./dist-popup
```
