# solid-auth-client

[![Build Status](https://travis-ci.org/solid/solid-auth-client.svg?branch=master)](https://travis-ci.org/solid/solid-auth-client)
[![Coverage Status](https://coveralls.io/repos/github/solid/solid-auth-client/badge.svg?branch=master)](https://coveralls.io/github/solid/solid-auth-client?branch=master)

Opaquely authenticates [Solid](https://github.com/solid/) clients

## About

### What is this?
This library facilitates authentication with Solid servers
by implementing [WebID-OIDC](https://github.com/solid/webid-oidc-spec).

### Why might I need this?

If you're creating a web app and want to identify users with Solid, or store
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
}): Promise<?session>
```

Authenticates the user with their IDP (identity provider) and promises an object
containing the user's session.

When the user is successfully authenticated, the session will be non-null.  When
the user is not authenticated by the IDP, the session will be `null`.

Auth flows like OIDC require the user to give consent on their identity provider.
In such cases, this function will _redirect the user to their auth provider_.
Then, call `currentSession` when the user gives consent and lands back in your app.

If don't want to take the user away from your app,
consider using the [popup workflow](#Logging-in-via-the-popup-app).

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
type webIdOidcSession = {
  idp: string,
  webId: string,
  accessToken: string,
  idToken: string
}
```

## Logging in via the popup app

To log in with a popup window, you'll need a popup application running on a
trusted domain which authenticates the user, handles redirects, and messages
the authenticated session back to your application.

In order to tell the user they're logging into *your* app, you'll need to
generate a static popup bound to your application's name.

### Generating a popup window

0. Make sure you've got the `solid-auth-client` package installed globally.
```sh
$ npm install -g solid-auth-client # [--save | --save-dev]
```

1. Run the generation script to generate the popup's HTML file.
```sh
$ solid-auth-client generate-popup "My App Name" # [my-app-popup.html]
```

2. Place the popup file on your server (say at `https://localhost:8080/popup.html`).

3. From within your own app, call `SolidAuthClient.popupLogin({ popupUri: 'https://localhost:8080/popup.html' })`.

## Developing

### Prerequisites

This library assumes you have [node](https://nodejs.org/en/) >= v7.10.1
installed. It may work with earlier
versions, but that hasn't been tested thus far.

### Setting up the development environment

```sh
$ git clone https://github.com/solid/solid-auth-client.git
$ cd solid-auth-client
$ npm install
$ npm run test     # run the code formatter, linter, and test suite
$ npm run test:dev # just run the tests in watch mode
```

### Acceptance Testing

You can test how `solid-auth-client` operates within an app by running the demo app.

#### Running the demo development server

```sh
$ POPUP_URI='http://localhost:8081/popup.html' npm run start:demo
```

#### Running the popup development server

```sh
$ APP_NAME='solid-auth-client demo' npm run start:popup
```
