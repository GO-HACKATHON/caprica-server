require('dotenv').config()
const { router, get, post } = require('microrouter')
const { json, send } = require('micro')
const _ = require('underscore')
const axios = require('axios')

const { OPENWEATHER_APPID } = process.env

if (OPENWEATHER_APPID === undefined ) {
  throw new Error('Missing API Key for OpenWeather.')
  process.exit(-1)
}

const OPENWEATHER_API_URL = 'http://api.openweathermap.org/data/2.5/weather?lat=35&lon=139&APPID=' + OPENWEATHER_APPID

const db = require('../util/db')

const getDataByReference = async (ref) => {
  let data
  const refData = await ref.once('value', snapshot => {
    data = _.extend(snapshot.val(), { id: snapshot.key })
  })

  return data
}

const createUser = async (req, res) => {
  const body = await json(req)
  
  const userRef = db.ref('users')
  const newUserRef = await userRef.push({
    name: body.name,
    is_connected: false,
    created_at: new Date().getTime(),
    updated_at: new Date().getTime()
  });

  const user = await getDataByReference(newUserRef)
  send(res, 200, user)
}

const getUser = async (req, res) => {
  const userId = req.params.id
  const user = await _getUserById(userId)

  send(res, 200, user)
}

const getUsers = async (req, res) => {
  let isConnected
  if (!_.isUndefined(req.query.is_connected)) {
    isConnected = req.query.is_connected
  }

  let users = []
  const userRef = await db.ref('users').once('value', snapshot => {
    _.mapObject(snapshot.val(), function (user, key) {
      if (!_.isUndefined(isConnected)) {
        if (_.isEqual(user.is_connected.toString(), isConnected)) {
          users.push(_.extend(user, { id: key })) 
        }
      }
      else {
        users.push(_.extend(user, { id: key }))  
      }
    })
  })

  send(res, 200, users)
}

const _getUserById = async (userId) => {
  let user
  const userRef = await db.ref('users/' + userId).once('value', snapshot => {
    user = _.extend(snapshot.val(), { id: snapshot.key })
  })

  return user
}

const connectUser = async (req, res) => {
  const userId = req.params.id
  const updatedUser = await db.ref('users/' + userId).update({
    is_connected: true
  })

  const speedRef = db.ref('userlogs')
  const newSpeedRef = await speedRef.push({
    user_id: userId,
    is_connected: true,
    created_at: new Date().getTime(),
    updated_at: new Date().getTime()
  })

  const user = await _getUserById(userId)
  send(res, 200, user)
}

const disconnectUser = async (req, res) => {
  const userId = req.params.id
  const updatedUser = await db.ref('users/' + userId).update({
    is_connected: false
  })

  const speedRef = db.ref('userlogs')
  const newSpeedRef = await speedRef.push({
    user_id: userId,
    is_connected: true,
    created_at: new Date().getTime(),
    updated_at: new Date().getTime()
  })

  const user = await _getUserById(userId)
  send(res, 200, user)
}

const storeUserSpeed = async (req, res) => {
  const body = await json(req)
  const userId = req.params.id
  
  const speedRef = db.ref('speeds')
  const newSpeedRef = await speedRef.push({
    user_id: userId,
    speed: body.speed,
    created_at: new Date().getTime(),
    updated_at: new Date().getTime()
  })

  const speedData = await getDataByReference(newSpeedRef)
  const userData = await _getUserById(userId)

  return _.extend(speedData, { name: userData.name })
}

const getUserSpeeds = async (req, res) => {
  const userId = req.params.id
  
  let userSpeeds = []
  const userSpeedsRef = await db.ref('speeds').once('value', snapshot => {
    _.mapObject(snapshot.val(), function (userSpeed, key) {
      if (userSpeed.user_id === userId) {
        userSpeeds.push(_.extend(userSpeed, { id: key }))
      }
    })
  })

  send(res, 200, userSpeeds)  
}

const getSpeeds = async (req, res) => {
  let speeds = []
  const speedsRef = await db.ref('speeds').once('value', snapshot => {
    _.mapObject(snapshot.val(), function (speed, key) {
      speeds.push(_.extend(speed, { id: key }))
    })
  })

  send(res, 200, speeds)  
}

const getUserSpeedWarnings = async (req, res) => {
  const userId = req.params.id
  
  let userSpeedWarnings = []
  const userSpeedWarningsRef = await db.ref('warnings').once('value', snapshot => {
    _.mapObject(snapshot.val(), function (userSpeedWarning, key) {
      if (userSpeedWarning.user_id === userId) {
        userSpeedWarnings.push(_.extend(userSpeedWarning, { id: key }))
      }
    })
  })

  send(res, 200, userSpeedWarnings)  
}

const getSpeedWarnings = async (req, res) => {
  let speedWarnings = []
  const speedWarningsRef = await db.ref('warnings').once('value', snapshot => {
    _.mapObject(snapshot.val(), function (speedWarning, key) {
      speedWarnings.push(_.extend(speedWarning, { id: key }))
    })
  })

  send(res, 200, speedWarnings)  
}

const notifyUserSpeedWarning = async (req, res) => {
  const userId = req.params.id
  
  const speedRef = db.ref('warnings')
  const newSpeedRef = await speedRef.push({
    user_id: userId,
    created_at: new Date().getTime(),
    updated_at: new Date().getTime()
  })

  const speedWarningData = await getDataByReference(newSpeedRef)
  const userData = await _getUserById(userId)

  return _.extend(speedWarningData, { name: userData.name })
}

const storeRashAndGeolocationValue = async (req, res) => {
  const body = await json(req)
  const userId = req.params.id

  const weatherData = await axios.get(OPENWEATHER_API_URL).
                                  then( function (response) { return response.data } )
                                  .catch( function (error) { return error } )

  // TO-DO: clasify status from rash value

  const rashRef = db.ref('rashs')
  const newRashRef = await rashRef.push({
    user_id: userId,
    rash: body.rash,
    status: body.status,
    longitude: body.longitude,
    latitude: body.latitude,
    weather: extractWeatherData(weatherData),
    created_at: new Date().getTime(),
    updated_at: new Date().getTime()
  })
  
  const rashData = await getDataByReference(newRashRef)
  const userData = await _getUserById(userId)

  return _.extend(rashData, { name: userData.name })
}

const getUserRashs = async (req, res) => {
  const userId = req.params.id
  
  let userRashs = []
  const userRashsRef = await db.ref('rashs').once('value', snapshot => {
    _.mapObject(snapshot.val(), function (userRash, key) {
      if (userRash.user_id === userId) {
        userRashs.push(_.extend(userRash, { id: key }))
      }
    })
  })

  send(res, 200, userRashs)  
}

const getRashs = async (req, res) => {
  let rashs = []
  const rashsRef = await db.ref('rashs').once('value', snapshot => {
    _.mapObject(snapshot.val(), function (rash, key) {
      rashs.push(_.extend(rash, { id: key }))
    })
  })

  send(res, 200, rashs)  
}

const notifyUserAccident = async (req, res) => {
  const body = await json(req)
  const userId = req.params.id

  const accidentRef = db.ref('accidents')
  const newAccidentRef = await accidentRef.push({
    user_id: userId,
    longitude: body.longitude,
    latitude: body.latitude,
    speed: body.speed,
    created_at: new Date().getTime(),
    updated_at: new Date().getTime()
  })
  
  const rashData = await getDataByReference(newAccidentRef)
  const userData = await _getUserById(userId)

  // TO-DO: Send alert to emergency line

  return _.extend(rashData, { name: userData.name })
}

const getUserAccidents = async (req, res) => {
  const userId = req.params.id
  
  let userAccidents = []
  const userAccidentsRef = await db.ref('accidents').once('value', snapshot => {
    _.mapObject(snapshot.val(), function (userAccident, key) {
      if (userAccident.user_id === userId) {
        userAccidents.push(_.extend(userAccident, { id: key }))
      }
    })
  })

  send(res, 200, userAccidents)  
}

const getAccidents = async (req, res) => {
  let accidents = []
  const accidentsRef = await db.ref('accidents').once('value', snapshot => {
    _.mapObject(snapshot.val(), function (accident, key) {
      accidents.push(_.extend(accident, { id: key }))
    })
  })

  send(res, 200, accidents)  
}

const extractWeatherData = function (weatherData) {
  return {
    category: weatherData.weather[0].main,
    description: weatherData.weather[0].description,
    temperature: weatherData.main.temp,
    pressure: weatherData.main.pressure,
    humidity: weatherData.main.humidity,
    temperature_max: weatherData.main.temp_max,
    temperature_min: weatherData.main.temp_min,
    wind_speed: weatherData.wind.speed
  }
}

module.exports = router(
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
)
