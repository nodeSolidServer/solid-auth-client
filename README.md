# A library for reading and writing to Solid pods

[![Build Status](https://travis-ci.org/solid/solid-auth-client.svg?branch=master)](https://travis-ci.org/solid/solid-auth-client)
[![Coverage Status](https://coveralls.io/repos/github/solid/solid-auth-client/badge.svg?branch=master)](https://coveralls.io/github/solid/solid-auth-client?branch=master)

The [Solid](https://solid.mit.edu/) project
allows people to use apps on the Web
while storing their data in their own data pod.

`solid-auth-client` is a browser library that allows
your apps to securely log in to Solid data pods
and read and write data from them.

## Usage
In the browser, the library is accessible through `solid.auth`:
```html
<script src="https://solid.github.io/solid-auth-client/dist/solid-auth-client.bundle.js"></script>
<script>
solid.auth.trackSession(session => {
  if (!session)
    console.log('The user is not logged in')
  else
    console.log(`The user is ${session.webId}`)
})
</script>
```

When developing for webpack in a Node.js environment,
run `npm install solid-auth-client` and then do:

```javascript
const auth = require('solid-auth-client')

auth.trackSession(session => {
  if (!session)
    console.log('The user is not logged in')
  else
    console.log(`The user is ${session.webId}`)
})
```

Note that this library is intended for the browser.
You can use Node.js as a development environment,
but not for actually logging in and out or making requests.

## Functionality
This library offers two main types of functionality:
- `fetch` functionality to make authenticated HTTP requests to a Solid pod
- login and logout functionality to authenticate the user

### Reading and writing data
The `fetch` method mimics
the browser's [`fetch` API]((https://fetch.spec.whatwg.org/)): 
it has the same signature and also returns a promise that resolves to the response to the request.
You can use it to access any kind of HTTP(S) document,
regardless of whether that document is on a Solid pod:

```javascript
solid.auth.fetch('https://timbl.com/timbl/Public/friends.ttl')
  .then(console.log);
```

```javascript
const { fetch } = solid.auth;
fetch('https://timbl.com/timbl/Public/friends.ttl')
  .then(console.log);
```

If the document is on a Solid pod,
and the user is logged in,
they will be able to access private documents
that require read or write permissions.

### Logging in
Since Solid is decentralized,
users can have an account on any server.
Therefore, users need to pick their identity provider (IDP)
in order to log in.

If your application asks them
for the URL of their identity provider,
then you can call the `login` method with the IDP as an argument:
```javascript
async function login(idp) {
  const session = await solid.auth.currentSession();
  if (!session)
    await solid.auth.login(idp);
  else
    alert(`Logged in as ${session.webId}`);
}
login('https://solid.community');
```
Be aware that this will _redirect_ the user away from your application
to their identity provider.
When they return, `currentSession()` will return their login information.

If you want `solid-auth-client` to ask the user for their identity provider,
then you can use a popup window:
```javascript
async function popupLogin() {
  let session = await solid.auth.currentSession();
  let popupUri = 'https://solid.community/common/popup.html';
  if (!session)
    session = await solid.auth.popupLogin({ popupUri });
  alert(`Logged in as ${session.webId}`);
}
popupLogin();
```
The popup has the additional benefit
that users are not redirected away.

You can find a popup in `dist-popup/popup.html`.

### Logging out
To log out, simply call the `logout` method:
```javascript
solid.auth.logout()
  .then(() => alert('Goodbye!'));
```

### Getting the current user
The current user is available through the `currentSession` method.
This returns a session, with the `webId` field indicating the user's WebID.

```javascript
async function greetUser() {
  const session = await solid.auth.currentSession();
  if (!session)
    alert('Hello stranger!');
  else
    alert(`Hello ${session.webId}!`);
}
greetUser();
```

If you want to track user login and logout,
use the `trackSession` method instead.
It will invoke the callback with the current session,
and notify you of any changes to the login status.

```javascript
solid.auth.trackSession(session => {
  if (!session)
    alert('Hello stranger!');
  else
    alert(`Hello ${session.webId}!`);
});
```

### Events

`SolidAuthClient` implements [`EventEmitter`](https://nodejs.org/api/events.html)
and emits the following events:
- `login (session: Session)` when a user logs in
- `logout ()` when a user logs out
- `session (session: Session | null)` when a user logs in or out


## Advanced usage

### Generating a popup window
To log in with a popup window, you'll need a popup application running on a
trusted domain which authenticates the user, handles redirects, and messages
the authenticated session back to your application.

In order to tell the user they're logging into *your* app, you'll need to
generate a static popup bound to your application's name.

0. Make sure you've got the `solid-auth-client` package installed globally.
```sh
$ npm install -g solid-auth-client # [--save | --save-dev]
```

1. Run the generation script to generate the popup's HTML file.
```sh
$ solid-auth-client generate-popup # ["My App Name"] [my-app-popup.html]
```

2. Place the popup file on your server (say at `https://localhost:8080/popup.html`).

3. From within your own app, call `solid.auth.popupLogin({ popupUri: 'https://localhost:8080/popup.html' })`.


## Developing `solid-auth-client`
Developing this library requires [Node.js](https://nodejs.org/en/) >= v8.0.

### Setting up the development environment

```sh
$ git clone https://github.com/solid/solid-auth-client.git
$ cd solid-auth-client
$ npm install
$ npm run test     # run the code formatter, linter, and test suite
$ npm run test:dev # just run the tests in watch mode
```

### Demo app

You can test how `solid-auth-client` operates within an app by running the demo app.

#### Running the demo development server

```sh
$ POPUP_URI='http://localhost:8606/popup-template.html' npm run start:demo
```

#### Running the popup development server

```sh
$ APP_NAME='solid-auth-client demo' npm run start:popup
```
