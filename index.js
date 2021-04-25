const updater = require('./updater')
const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
let runOnly

try {
  if (fs.existsSync('./.run-only')) {
    runOnly = fs
      .readFileSync('./.run-only', { encoding: 'utf8', flag: 'r' })
      .trim()
    if (!Object.keys(updater).includes(runOnly)) {
      runOnly = undefined
    }
  }
} catch (err) {
  // error
}

const db = new sqlite3.Database('./db/db')

const { initDatabase } = require('./db/init')
initDatabase(db)

Object.keys(updater).map((update) => {
  if (!runOnly || (runOnly && runOnly === update)) {
    updater[update].run(db)
  }
})

db.each('SELECT rowid AS id, sim_name, sim_id FROM teams', function (err, row) {
  console.log(`${row.id}: ${row.sim_name} (${row.sim_id})`)
})

db.close()
