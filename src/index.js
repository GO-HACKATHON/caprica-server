require('dotenv').config()
const { router, get, post } = require('microrouter')
const { json, send } = require('micro')
const _ = require('underscore')

const db = require('../util/db')

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

const connectUser = async (req, res) => {
  const userId = req.params.id
  const updatedUser = await db.ref('users/' + userId).update({
    is_connected: true
  })

  const user = await _getUserById(userId)
  send(res, 200, user)
}

const disconnectUser = async (req, res) => {
  const userId = req.params.id
  const updatedUser = await db.ref('users/' + userId).update({
    is_connected: false
  })

  const user = await _getUserById(userId)
  send(res, 200, user)
}

const getUser = async (req, res) => {
  const userId = req.params.id
  const user = await _getUserById(userId)

  send(res, 200, user)
}

const _getUserById = async (userId) => {
  let user
  const userRef = await db.ref('users/' + userId).once('value', snapshot => {
    user = _.extend(snapshot.val(), { id: snapshot.key })
  })

  return user
}

const getDataByReference = async (ref) => {
  let data
  const refData = await ref.once('value', snapshot => {
    data = _.extend(snapshot.val(), { id: snapshot.key })
  })

  return data
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

module.exports = router(
  post('/users', createUser),
  get('/users/:id', getUser),
  post('/users/:id/connect', connectUser),
  post('/users/:id/disconnect', disconnectUser),
  post('/users/:id/speeds', storeUserSpeed)
)
