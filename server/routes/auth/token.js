const express = require('express'),
  router = express.Router(),
  jwt = require('jsonwebtoken'),
  refreshTokenHandler = require('../../helpers/refreshTokenHandler'),
  generateToken = require('../../helpers/generateToken')

router.post('/', (req, res) => {
  const { token } = req.body

  if (!token) {
    return res.sendStatus(401)
  }

  if (!refreshTokenHandler.exists(token)) {
    return res.sendStatus(403)
  }

  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403)
    }

    const accessToken = generateToken.access({
      username: user.username,
      role: user.role
    })

    res.json({
      accessToken
    })
  })
})

module.exports = router
