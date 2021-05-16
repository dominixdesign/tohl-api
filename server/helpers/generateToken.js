const jwt = require('jsonwebtoken'),
  refreshTokenHandler = require('./refreshTokenHandler')

module.exports = {
  access: ({ username, roles, mail, userid }) => {
    return jwt.sign(
      { username, roles, mail, userid },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: '48h'
      }
    )
  },
  refresh: ({ username, roles, mail, userid }) => {
    const refreshToken = jwt.sign(
      { username, roles, mail, userid },
      process.env.REFRESH_TOKEN_SECRET
    )
    refreshTokenHandler.add(refreshToken)
    return refreshToken
  }
}
