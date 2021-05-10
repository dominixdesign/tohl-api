const express = require('express'),
  bcrypt = require('bcrypt'),
  router = express.Router(),
  generateToken = require('../../helpers/generateToken'),
  db = require('../../helpers/db')

router.post('/', async (req, res) => {
  const { username, password } = req.body

  const user = await db('manager')
    .where({
      mail: username
    })
    .first('password', 'username', 'mail')

  if (bcrypt.compareSync(password, user.password)) {
    const accessToken = generateToken.access({
      username: user.username,
      mail: user.mail
    })
    const refreshToken = generateToken.refresh({
      username: user.username,
      mail: user.mail
    })

    res.json({
      accessToken,
      refreshToken
    })
  } else {
    res.send('Username or password incorrect')
  }
})

module.exports = router
