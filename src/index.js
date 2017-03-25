const {send} = require('micro')
const db = require('../util/db')

module.exports = async (req, res) => {
  // TODO: remove name and get correct data
  const name = await db.ref('meta').once('value', snapshot => snapshot.val())
  send(res, 200, {caprica: 'online', name})
}
