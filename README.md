# Caprica Server

> A microservice for Caprica Systems

<img src="/server.gif" />

# Usage

```sh
$ yarn start
# or
$ npm start
```

# Pre-requisites

Ask [@mathdroid](https://github.com/mathdroid) for `capricaServiceAccount.json`. It will be required for Firebase connection.

Or supply `FIREBASE_ID`, `FIREBASE_EMAIL` and `FIREBASE_PRIVATE_KEY` of your own.

```sh
$ yarn
# or
$ npm install
```

# APIs

```
[
  post('/users', createUser),
  post('/users/:id/connect', connectUser),
  post('/users/:id/disconnect', disconnectUser),
  post('/users/:id/speeds', storeUserSpeed),
  post('/users/:id/speedwarning', notifyUserSpeedWarning),
  post('/users/:id/rash', storeRashAndGeolocationValue),
  post('/users/:id/accident', notifyUserAccident),

  get('/users', getUsers),
  get('/users/:id', getUser),
  get('/users/:id/speeds', getUserSpeeds),
  get('/users/:id/speedwarning', getUserSpeedWarnings),
  get('/users/:id/accidents', getUserAccidents),
  get('/users/:id/rash', getUserRashs),

  get('/accidents', getAccidents),
  get('/speeds', getSpeeds),
  get('/rashs', getRashs),
  get('/speedwarnings', getSpeedWarnings)
]
```

# License

MIT (c) 2017 SSX_Ceria Team
