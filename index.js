const updater = require('./updater')
const { init } = require('./lib/team')
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

const runAll = async () => {
  await init()
  for (const update of Object.keys(updater)) {
    if (!runOnly || (runOnly && runOnly === update)) {
      await updater[update].run()
    }
  }
  process.exit()
}

runAll()
