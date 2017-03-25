const admin = require('firebase-admin')
const {FIREBASE_ID, FIREBASE_EMAIL, FIREBASE_PRIVATE_KEY} = process.env

if (FIREBASE_ID === undefined || FIREBASE_EMAIL === undefined || FIREBASE_PRIVATE_KEY === undefined) {
  throw new Error('Missing credentials.')
  process.exit(-1)
}

const privateKey = `-----BEGIN PRIVATE KEY-----
${FIREBASE_PRIVATE_KEY.toString()}
-----END PRIVATE KEY-----
`

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_ID,
      clientEmail: FIREBASE_EMAIL,
      privateKey
    }),
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
