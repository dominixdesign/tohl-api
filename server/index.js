require('dotenv').config()

const express = require('express')
const { ApolloServer } = require('apollo-server-express')
const { makeExecutableSchema } = require('@graphql-tools/schema')
const bodyParser = require('body-parser')
const authMiddleware = require('./middleware/auth')
const jwt = require('jsonwebtoken')
const AuhtDirective = require('./middleware/authDirective')
const ownTeamDirective = require('./middleware/ownTeamDirective')
const managedTeamDirective = require('./middleware/managedTeamDirective')
const db = require('./helpers/db')

// modules
const modules = ['global', 'manager', 'team', 'player']
let _typeDefs = []
let _resolvers = []
modules.forEach((module) => {
  const { typeDefs, resolvers } = require(`./graphql/${module}`)
  _typeDefs.push(typeDefs)
  _resolvers.push(resolvers)
})

const server = new ApolloServer({
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
      ownTeam: validTeams
        .filter((t) => t.type === 'OWNER')
        .map((t) => t.teamid)
        .join(),
      validTeams: validTeams.map((t) => t.teamid)
    }
  }
})

const app = express()
server.applyMiddleware({ app })
app.use(bodyParser.json())
app.use(require('./routes'))

app.get('/', (req, res) => {
  return res.send('Received a GET HTTP method after the restart')
})

app.get('/backend', authMiddleware, (req, res) => {
  return res.send('Received a GET HTTP method after the restart')
})

app.post('/', (req, res) => {
  return res.send('Received a POST HTTP method')
})

app.put('/', (req, res) => {
  return res.send('Received a PUT HTTP method')
})

app.delete('/', (req, res) => {
  return res.send('Received a DELETE HTTP method')
})

app.listen(3000, () => console.log(`Example app listening on port 3000!`))
