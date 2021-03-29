const updater = require('./updater')
const sqlite3 = require('sqlite3').verbose()

const db = new sqlite3.Database(':memory:')

const { initDatabase } = require('./db/init')
initDatabase(db)

Object.keys(updater).map((update) => {
  updater[update].run(db)
})

//db.each('SELECT rowid AS id, sim_name FROM teams', function (err, row) {
// console.log(row.id + ': ' + row.sim_name)
//})

db.close()
