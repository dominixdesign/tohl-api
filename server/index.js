require('dotenv').config()

const express = require('express')
const { ApolloServer } = require('apollo-server-express')
const bodyParser = require('body-parser')
const authMiddleware = require('./middleware/auth')
const jwt = require('jsonwebtoken')
// eslint-disable-next-line no-unused-vars
const db = require('./helpers/db')

const server = new ApolloServer({
  modules: [require('./graphql/manager'), require('./graphql/player')],
  context: ({ req, res }) => {
    const authHeader = req.headers.authorization
    let user = {}

    if (authHeader) {
      const token = authHeader.split(' ')[1]
      user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
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
