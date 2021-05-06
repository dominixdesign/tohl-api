const express = require('express')

const app = express()

app.get('/', (req, res) => {
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
