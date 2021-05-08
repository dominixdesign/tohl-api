const express = require('express'),
  router = express.Router(),
  refreshTokenHandler = require('../../helpers/refreshTokenHandler')

router.post('/', (req, res) => {
  const { token } = req.body
  refreshTokenHandler.remove(token)

  res.send('Logout successful')
})

module.exports = router
