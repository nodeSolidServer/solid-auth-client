# solid-auth-client

[![Build Status](https://travis-ci.org/solid/solid-auth-client.svg?branch=master)](https://travis-ci.org/solid/solid-auth-client)
[![Coverage Status](https://coveralls.io/repos/github/solid/solid-auth-client/badge.svg?branch=master)](https://coveralls.io/github/solid/solid-auth-client?branch=master)

Opaquely authenticates [Solid](https://github.com/solid/) clients

## About

### What is this?

Solid currently supports two cross-origin authentication protocols,
[WebID-TLS](https://www.w3.org/2005/Incubator/webid/spec/tls/) and
[WebID-OIDC](https://github.com/solid/webid-oidc-spec).

This library abstracts away the implementation details of these specs so that
clients don't have to handle different authentication protocols.

### Why might I need this?

If you're building a web app and want to identify users with Solid, or store
personal information on your user's Solid account, you'll have to authenticate
them.  This library provides a simple API for logging in, logging out, and
fetching resources with authenticated credentials.

### How do I get this?

The simplest way to use this library is to install it via `npm` or `yarn`.
You can then use the ES6 module (`import { login, currentUser, logout } from
'solid-auth-client'`), or you can grab the transpiled UMD bundle from
`node_modules/solid-auth-client/dist-lib/solid-auth-client.bundle.js`.

## API

*This API doc uses [flow](https://flow.org/) type annotations for clarity.
They're just here to show you the types of arguments expected by exported
functions.  You don't have to know anything about flow.*

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
user away from your app, consider using the [popup workflow](#Logging-in-via-the-popup-app).

If there's an error during the auth handshake, the Promise will reject.

Options:
- `callbackUri` (default current window location): a URI to be redirected back
  to with credentials for auth flows which involve redirects
- `storage`: An object implementing the storage interface for persisting
  credentials.  `localStorage` is the default in the browser.

### `popupLogin`

```
popupLogin({
  popupUri: ?string,
  storage: AsyncStorage
}): Promise<?session>
```

Logs the user in using a popup window so that your app doesn't lose state.
See [Logging in via the popup app](#Logging-in-via-the-popup-app).

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

## Logging in via the popup app

To log in with a popup window, you'll need a popup application running on a
trusted domain which authenticates the user, handles redirects, and messages
the authenticated session back to your application.

In order to tell the user they're logging into *your* app, you'll need to
build a static popup bound to your application's name.

Keeping this in mind, it's pretty simple to build a popup for your app!

### Building the popup

0. Make sure you've got the `solid-auth-client` package installed locally.
```sh
$ npm i solid-auth-client # [--save | --save-dev]
```

1. Run the build script!
```sh
$ solid-auth-client generate-popup "My App's Name" # [my-app-popup.html]
```

2. If your popup is deployed to e.g. 'https://localhost:8080/popup.html',
call `popupLogin({ popupUri: 'https://localhost:8080/popup.html' })`.

## Developing

### Prerequisites

This library assumes you have [node](https://nodejs.org/en/) >= v7.10.1  and
[yarn](https://yarnpkg.com/) 0.24.6 installed.  It may work with earlier
versions, but that hasn't been tested thus far.

### Setting up the development environment

```sh
$ git clone https://github.com/solid/solid-auth-client.git
$ cd solid-auth-client
$ yarn
$ yarn build # build the library and UMD bundle
$ yarn test # run the code formatter, linter, and test suite
$ yarn test:dev # just run the tests in watch mode
```

### Acceptance Testing

You can test how `solid-auth-client` operates within an app by running the demo app.

#### Running the demo development server

```sh
$ POPUP_URI='http://localhost:8081/popup.html' yarn start:demo
```

#### Running the popup development server

```sh
$ APP_NAME='solid-auth-client demo' yarn start:popup
```
