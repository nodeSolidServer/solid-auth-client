# solid-auth-client: A library for authentication to Solid pods

[![Build Status](https://travis-ci.org/solid/solid-auth-client.svg?branch=master)](https://travis-ci.org/solid/solid-auth-client)
[![Coverage Status](https://coveralls.io/repos/github/solid/solid-auth-client/badge.svg?branch=master)](https://coveralls.io/github/solid/solid-auth-client?branch=master)

The [Solid](https://solid.mit.edu/) project
allows people to use apps on the Web
while storing their data in their own data pod.

`solid-auth-client` is a *browser based* library, that allows
your apps to securely log into Solid data pods, and read and write data from them.

## Usage

In browser, the `solid-auth-client` library is accessible through `solid.auth`. 

1. Add the bundle, to your html page. 

```html
 <script src="https://solid.github.io/solid-auth-client/dist/solid-auth-client.bundle.js"></script>
```
*This bundle is meant for testing purposes only, you should build your own bundles from the latest release source. The build instructions are provided below.*

2. In your javascript code add,
```js
solid.auth.trackSession(session => {
  if (!session)
    console.log('The user is not logged in')
  else
    console.log(`The user is ${session.webId}`)
})
```



## Features

This library offers following features: 
- `a session` variable to keep track of user's log in or out state. It is set to null when user is not logged in.
- `login` and `logout` features to authenticate the user.
- `fetch` feature to make authenticated HTTP requests to a Solid pod.



### Session Variable

The `session` variable keeps the track of user.  It tells if the user is logged in into their pod. 

It  also lets the application to know, if the user has authenticated the app to read/write into their pod. An instance of session variable can be created using `solid.auth.currentSession()` method. 

```js
async function greetUser() {
  const session = await solid.auth.currentSession();
  if (!session)
    alert('Hello stranger!');
  else
    alert(`Hello ${session.webId}!`);
}
greetUser();
```

*The `solid.auth.currentSession()`  method returns `null` if the user is not logged in.* If the user is logged in. It returns a session variable, with webId field containing webId of logged in the user.

The `solid.auth.currentsession()` provides information, if the user is logged in or not but, it does not keep track of if the  user. If you want to keep the track of log in and out of the user, use `solid.auth.trackSession()` instead.

```js
solid.auth.trackSession(session => {
  if (!session)
    alert('Hello stranger!');
  else
    alert(`Hello ${session.webId}!`);
});
```

*The solid.auth.tracksession() accepts a callback method and executes it, every time there is a change in the login status.*

### Login

Solid is decentralized,
so users can have an account on a solid server of their choice.
Therefore, users need to pick their identity provider (IDP)
in order to log in.

The `login` method uses IDP (Identity Provider) in order to log a user into the solid pod. If your application has grabbed the IDP's URL from the user, you can directly call the login method.

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
You must be aware that, this will _redirect_ the user
to their identity provider.
When they return, `currentSession()` will return hold their login information.

If you want `solid-auth-client` to ask the user for their identity provider,
You can use, popup login to do this.

```javascript
async function popupLogin() {
  let session = await solid.auth.currentSession();
  let popupUri = 'https://solid.community/common/popup.html';
  if (!session)
    session = await solid.auth.popupLogin({ popupUri });
  alert(`Logged in as ${session.webId}`);
}
popupLogin();
```
The popup has the additional benefit
that users are not redirected away.

You can find a popup in `dist-popup/popup.html`.

### Logout

To log out, simply call the `logout` method:
```javascript
solid.auth.logout()
  .then(() => alert('Goodbye!'));
```



### Read/Write data

The `fetch` method mimics the browser's [`fetch` API]((https://fetch.spec.whatwg.org/)).
You can use it to access any kind of HTTP(S) document, regardless of whether that document is on a Solid pod:

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

## Events

`SolidAuthClient` implements [`EventEmitter`](https://nodejs.org/api/events.html)
and emits the following events:

- `login (session: Session)` when a user logs in
- `logout ()` when a user logs out
- `session (session: Session | null)` when a user logs in or out

## Building a solid-auth-client bundle

1. Grab the source from the [Release page](https://github.com/solid/solid-auth-client/releases). *Click on the the version number to get the source for that version.*

2. Make sure you have Node.js installed, it requires Node.js >=8.0.

   ```shell
   $ node --version
   ```

3. Install all the dependencies. 

   ```shell
   $ npm install
   ```

4. Build the bundle

   ```shell
   $ npm run build
   ```
5. The builded bundle will be stored in the ./dist directory.

## solid-auth-client and NodeJs

The `solid-auth-client` is a browser only library but, it can be used with NodeJs to perform some tasks related to authentication of the user. 

### Installation

```shell
$ npm install solid-auth-client
```

### Tracking the login status in NodeJs

```javascript
const auth = require('solid-auth-client')

auth.trackSession(session => {
  if (!session)
    console.log('The user is not logged in')
  else
    console.log(`The user is ${session.webId}`)
})
```

Note: The `solid-auth-client` is browser only library, so it cannot to be used to authenticate a user on a server or in NodeJs enviornment. You can use [solid-cli](https://github.com/solid/solid-cli) to login when using NodeJs.

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

## Developing  solid-auth-client

### Requirements

This library requires [Node.js](https://nodejs.org/en/) >= v8.0. for its development

### Setting up the development environment

```sh
$ git clone https://github.com/solid/solid-auth-client.git
$ cd solid-auth-client
$ npm install
$ npm run test     # run the code formatter, linter, and test suite
$ npm run test:dev # just run the tests in watch mode
```

### Running a demo app

You can test how `solid-auth-client` operates within an app by running the demo app.

#### Running the demo development server

```sh
$ POPUP_URI='http://localhost:8081/popup-template.html' npm run start:demo
```

#### Running the popup development server

```sh
$ APP_NAME='solid-auth-client demo' npm run start:popup
```

