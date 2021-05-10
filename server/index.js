require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser')
const authMiddleware = require('./middleware/auth')
// eslint-disable-next-line no-unused-vars
const db = require('./helpers/db')

const app = express()
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
