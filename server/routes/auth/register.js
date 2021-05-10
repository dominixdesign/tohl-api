const express = require('express'),
  router = express.Router(),
  bcrypt = require('bcrypt'),
  db = require('../../helpers/db')

router.post('/', async (req, res) => {
  const { mail, username, password } = req.body
  if (!mail || !username || !password) {
    res.status(400).send('missing body parts')
    return
  }
  const saltRounds = 10
  const hash = bcrypt.hashSync(password, saltRounds)

  await db('manager').insert({ mail, username, password: hash })
  res.send('OK')
})

module.exports = router
