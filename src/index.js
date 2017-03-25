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
  let users = []
  const userRef = await db.ref('users').once('value', snapshot => {
    _.mapObject(snapshot.val(), function (user, key) {
      users.push(_.extend(user, { id: key }))
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
  
  const speedRef = db.ref('speeds')

  // const newSpeedRef = await speedRef.push({
  //   user_id: userId,
  //   speed: body.speed,
  //   created_at: new Date().getTime(),
  //   updated_at: new Date().getTime()
  // })

  // const speedData = await getDataByReference(newSpeedRef)
  // const userData = await _getUserById(userId)

  // return _.extend(speedData, { name: userData.name })
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
  get('/users/:id/speeds', getUserSpeeds)
)
