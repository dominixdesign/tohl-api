require('dotenv').config()

const express = require('express')
const { ApolloServer } = require('apollo-server-express')
const { makeExecutableSchema } = require('@graphql-tools/schema')
const bodyParser = require('body-parser')
const authMiddleware = require('./middleware/auth')
const jwt = require('jsonwebtoken')
const AuhtDirective = require('./middleware/authDirective')
// eslint-disable-next-line no-unused-vars
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
      auth: AuhtDirective
    }
  }),
  context: ({ req }) => {
    const authHeader = req.headers.authorization
    let user = {}

    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1]
        user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
      } catch (e) {
        console.log(e)
        user = {}
      }
    }
    return { user }
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
