require('dotenv').config()

const express = require('express')
const fileUpload = require('express-fileupload')
const { ApolloServer } = require('apollo-server-express')
const { makeExecutableSchema } = require('@graphql-tools/schema')
const jwt = require('jsonwebtoken')
const AuhtDirective = require('./middleware/authDirective')
const ownTeamDirective = require('./middleware/ownTeamDirective')
const managedTeamDirective = require('./middleware/managedTeamDirective')
const db = require('./helpers/db')
const createDataloders = require('./helpers/dataLoaders')

const allowedErrors = ['BAD_USER_INPUT']

// modules
const modules = [
  'global',
  'auth',
  'manager',
  'team',
  'player',
  'playerstats',
  'teamstats',
  'game',
  'goal',
  'penalty',
  'game_event',
  'lineup'
]
let _typeDefs = []
let _resolvers = []
modules.forEach((module) => {
  const { typeDefs, resolvers } = require(`./graphql/${module}`)
  _typeDefs.push(typeDefs)
  _resolvers.push(resolvers)
})

const server = new ApolloServer({
  formatError: (err) => {
    // TODO: hier einbauen, dass mysql fehler nicht durchgereicht werden
    if (
      err.message.isAdmin ||
      (err &&
        err.extensions &&
        err.extensions.code &&
        allowedErrors.includes(err.extensions.code))
    ) {
      return err
    } else {
      console.log(err)
      return 'internal server error'
    }
  },
  plugins: [require('./middleware/errorHandling')],
  schema: makeExecutableSchema({
    typeDefs: _typeDefs,
    resolvers: _resolvers,
    schemaDirectives: {
      auth: AuhtDirective,
      ownTeam: ownTeamDirective,
      managedTeam: managedTeamDirective
    }
  }),
  context: async ({ req }) => {
    const authHeader = req.headers.authorization
    let user = {}
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1]
        if (token) {
          user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        }
      } catch (e) {
        console.log('JWT ERROR', e)
        user = {}
      }
    }

    let validTeams = []
    if (user.userid) {
      // add team ids
      validTeams = await db('manager_x_team')
        .select('teamid', 'type')
        .where('managerid', user.userid)
        .whereRaw('`valid_from` < now() and `valid_to` > now()')
        .orderByRaw('(`valid_to` - `valid_from`) desc')
    }
    return {
      user,
      loader: createDataloders(),
      ownTeam: validTeams
        .filter((t) => t.type === 'OWNER')
        .map((t) => t.teamid)
        .join(),
      validTeams: validTeams.map((t) => t.teamid)
    }
  }
})

const app = express()
server.applyMiddleware({
  app,
  cors: {
    origin: ['https://2016.my-tohl.org', 'https://my-tohl.org']
  }
})
app.use(
  fileUpload({
    createParentPath: true
  })
)
app.use(require('./routes/upload'))

app.listen(3000, () => console.log(`Example app listening on port 3000!`))
