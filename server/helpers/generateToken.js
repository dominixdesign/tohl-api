const jwt = require('jsonwebtoken'),
  refreshTokenHandler = require('./refreshTokenHandler')

module.exports = {
  access: ({ username, role }) => {
    return jwt.sign({ username, role }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: '48h'
    })
  },
  refresh: ({ username, role }) => {
    const refreshToken = jwt.sign(
      { username, role },
      process.env.REFRESH_TOKEN_SECRET
    )
    refreshTokenHandler.add(refreshToken)
    return refreshToken
  }
}
