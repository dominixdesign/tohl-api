const express = require('express'),
  router = express.Router()

router.use('/login', require('./login'))
router.use('/token', require('./token'))
router.use('/logout', require('./logout'))
router.use('/register', require('./register'))

module.exports = router
