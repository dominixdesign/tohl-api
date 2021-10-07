const express = require('express'),
  router = express.Router()

router.use('/auth', require('./auth'))
router.use('/upload', require('./upload'))

module.exports = router
