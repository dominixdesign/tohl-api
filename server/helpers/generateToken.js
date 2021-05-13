const jwt = require('jsonwebtoken'),
  refreshTokenHandler = require('./refreshTokenHandler')

module.exports = {
  access: ({ username, roles, mail }) => {
    return jwt.sign(
      { username, roles, mail },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: '48h'
      }
    )
  },
  refresh: ({ username, roles, mail }) => {
    const refreshToken = jwt.sign(
      { username, roles, mail },
      process.env.REFRESH_TOKEN_SECRET
    )
    refreshTokenHandler.add(refreshToken)
    return refreshToken
  }
}
