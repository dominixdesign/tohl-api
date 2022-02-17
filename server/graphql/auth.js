const { gql, UserInputError } = require('apollo-server-express'),
  axios = require('axios'),
  qs = require('qs'),
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
          let user = await db('manager')
            .where({
              mail: username
            })
            .first('password', 'username', 'mail', 'roles', 'id')

          if (!user) {
            // user unknown, try to login on old site
            const { data } = await axios({
              method: 'POST',
              headers: {
                'content-type': 'application/x-www-form-urlencoded',
                Accept: 'application/json'
              },
              data: qs.stringify({
                username,
                password
              }),
              url: 'https://my-tohl.org/tohl/login.php?login=true'
            })

            // found user in old database
            // create it in new database as well
            const hashedPw = await bcrypt.hash(password, 3)

            const newGM = await db('manager').insert({
              mail: data.email,
              username,
              password: hashedPw,
              roles: 'GM'
            })
            // managerid	teamid	valid_from	valid_to	type
            await db('manager_x_team').insert({
              managerid: newGM[0],
              teamid: data.team,
              valid_from: '2000-05-10 00:00:00',
              valid_to: '3000-05-17 00:00:00',
              type: 'OWNER'
            })

            user = await db('manager')
              .where({
                username
              })
              .first('password', 'username', 'mail', 'roles', 'id')
          }

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
          const userDB = await db('manager')
            .where({
              username: user.username,
              mail: user.mail
            })
            .first('password', 'username', 'mail', 'roles', 'id')
          if (!userDB) {
            throw new UserInputError('invalid user')
          }

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
