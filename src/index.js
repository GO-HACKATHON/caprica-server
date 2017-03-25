require('dotenv').config()
const { router, get, post } = require('microrouter')
const { json, send } = require('micro')

const db = require('../util/db')

const hello = async (req, res) =>
  send(res, 200, await Promise.resolve(`Hello ${req.params.who}`))

const user = async (req, res) => {
  const body = await json(req)
  send(res, 200, body)
}

module.exports = router(
  get('/hello/:who', hello),
  post('/user', user)
)
