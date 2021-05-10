const express = require('express'),
  bcrypt = require('bcrypt'),
  router = express.Router(),
  generateToken = require('../../helpers/generateToken'),
  db = require('../../helpers/db')

router.post('/', async (req, res) => {
  const { username, password } = req.body

  try {
    const user = await db('manager')
      .where({
        mail: username
      })
      .first('password', 'username', 'mail')

    if (user && bcrypt.compareSync(password, user.password)) {
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
      res.status(403).send('Username or password incorrect')
    }
  } catch (e) {
    res.status(403).send('invalid login data')
    console.error(e)
  }
})

module.exports = router
