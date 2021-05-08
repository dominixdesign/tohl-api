const express = require('express'),
  router = express.Router()

router.use('/login', require('./login'))
router.use('/token', require('./token'))
router.use('/logout', require('./logout'))

module.exports = router
