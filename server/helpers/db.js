const knex = require('knex')
const database = knex({
  client: 'mysql',
  connection: {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT || 3306,
    password: process.env.MYSQL_PASSWORD
  }
})

module.exports = database
