const express = require('express'),
  router = express.Router(),
  generateToken = require('../../helpers/generateToken')

const users = [
  {
    username: 'john',
    password: 'password123admin',
    role: 'admin'
  },
  {
    username: 'anna',
    password: 'password123member',
    role: 'member'
  }
]

router.post('/', (req, res) => {
  // Read username and password from request body
  const { username, password } = req.body

  // Filter user from the users array by username and password
  const user = users.find((u) => {
    return u.username === username && u.password === password
  })

  if (user) {
    const accessToken = generateToken.access({
      username: user.username,
      role: user.role
    })
    const refreshToken = generateToken.access({
      username: user.username,
      role: user.role
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
