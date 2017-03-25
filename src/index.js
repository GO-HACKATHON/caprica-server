require('dotenv').config()
const { router, get, post } = require('microrouter')
const { json, send } = require('micro')

const db = require('../util/db')

const user = async (req, res) => {
  const body = await json(req)
  
  const userRef = db.ref('users')
  const newUserRef = await userRef.push({
    name: body.name,
    is_connected: false
  });

  const user = await getDataByReference(newUserRef)
  send(res, 200, user)
}

const connect = async (req, res) => {
  const userId = req.params.id
  const updatedUser = await db.ref('users/' + userId).update({
    is_connected: true
  })

  const user = await getUser(userId)
  send(res, 200, user)
}

const disconnect = async (req, res) => {
  const userId = req.params.id
  const updatedUser = await db.ref('users/' + userId).update({
    is_connected: false
  })

  const user = await getUser(userId)
  send(res, 200, user)
}

const getUser = async (userId) => {
  const user = await db.ref('users/' + userId).once('value', snapshot => snapshot.val())
  return user
}

const getDataByReference = async (ref) => {
  const data = ref.once('value', snapshot => snapshot.val())
  return data
}

module.exports = router(
  post('/users', user),
  post('/users/:id/connect', connect),
  post('/users/:id/disconnect', disconnect)
)
