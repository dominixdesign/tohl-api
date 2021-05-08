const express = require('express'),
  router = express.Router()

router.use('/auth', require('./auth'))

module.exports = router
