const admin = require('firebase-admin')
const serviceAccount = require('../capricaServiceAccount.json')

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://caprica-4265b.firebaseio.com/'
  })
} catch (err) {
  // we skip the "already exists" message which is
  // not an actual error when we're hot-reloading
  if (!/already exists/.test(err.message)) {
    console.error('Firebase initialization error', err.stack)
  }
}

const db = admin.database()
module.exports = db
