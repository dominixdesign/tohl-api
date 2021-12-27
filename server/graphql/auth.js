const { gql, UserInputError } = require('apollo-server-express'),
  db = require('../helpers/db'),
  generateToken = require('../helpers/generateToken'),
  refreshTokenHandler = require('../helpers/refreshTokenHandler'),
  jwt = require('jsonwebtoken'),
  bcrypt = require('bcrypt')

module.exports = {
  typeDefs: gql`
    type Auth {
      access_token: String
      refresh_token: String
      manager: Manager
    }
    extend type Mutation {
      login(username: String!, password: String!, refresh: Boolean): Auth
      token(refresh_token: String!): Auth
      logout(refresh_token: String): Boolean
    }
  `,
  resolvers: {
    Auth: {
      manager: async (parent, _, { loader: { manager } }) =>
        manager.load(parent.id)
    },
    Mutation: {
      login: async (_, { username, password, refresh }) => {
        try {
          const user = await db('manager')
            .where({
              mail: username
            })
            .first('password', 'username', 'mail', 'roles', 'id')

          if (user && bcrypt.compareSync(password, user.password)) {
            const returnObj = {
              id: user.id,
              access_token: generateToken.access({
                username: user.username,
                mail: user.mail,
                roles: user.roles.split(',') || null,
                userid: user.id
              })
            }
            if (refresh) {
              returnObj['refresh_token'] = generateToken.refresh({
                username: user.username,
                mail: user.mail,
                roles: user.roles.split(',') || null,
                userid: user.id
              })
            }

            return returnObj
          } else {
            throw new UserInputError('invalid user credentials')
          }
        } catch (e) {
          throw new UserInputError('invalid user credentials')
        }
      },
      token: async (_, { refresh_token }) => {
        if (!refresh_token) {
          throw new UserInputError('token missing')
        }

        if (!refreshTokenHandler.exists(refresh_token)) {
          throw new UserInputError('invalid token')
        }

        let accessToken

        try {
          const user = jwt.verify(
            refresh_token,
            process.env.REFRESH_TOKEN_SECRET
          )
          accessToken = generateToken.access({
            username: user.username,
            roles: user.roles,
            mail: user.mail,
            userid: user.userid
          })
          return {
            id: user.userid,
            access_token: accessToken
          }
        } catch (err) {
          throw new UserInputError('invalid token')
        }
      },
      logout: (_, { refresh_token }) => {
        refreshTokenHandler.remove(refresh_token)
        return true
      }
    }
  }
}
