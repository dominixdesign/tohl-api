const updater = require('./index')
const { init } = require('../lib/functions')
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

const runAll = async (season) => {
  await init(season)
  for (const update of Object.keys(updater)) {
    if (!runOnly || (runOnly && runOnly === update)) {
      await updater[update].run()
    }
  }
  console.log(`
update for season "${season} done"


`)
  process.exit()
}

if (process.argv.length < 3) {
  console.log('erstes argument sollte die Saison sein.')
  process.exit()
}

runAll(process.argv[2])
