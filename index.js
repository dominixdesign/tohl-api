const updater = require('./updater')
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

const { initDatabase, all, close } = require('./db/init')
initDatabase()

Object.keys(updater).map((update) => {
  if (!runOnly || (runOnly && runOnly === update)) {
    updater[update].run()
  }
})

console.log(all('SELECT rowid AS id, sim_name, sim_id FROM teams'))

close()
