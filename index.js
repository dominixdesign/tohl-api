const chokidar = require('chokidar')
const unzipper = require('unzipper')
const updater = require('./updater')
const { init } = require('./lib/team')
const fs = require('fs')
let sleep = require('util').promisify(setTimeout)
let runOnly

chokidar
  .watch('./import-data/upload.zip', { atomic: 200 })
  .on('change', async (addedFile) => {
    await sleep(500)
    fs.createReadStream(addedFile)
      .pipe(unzipper.Parse())
      .on('entry', function (entry) {
        const fileName = entry.path
        if (fileName.includes('.ros')) {
          const season = fileName.split('.')[0]
          console.log(`Found Season "${season}". Start unpacking it`)
          unzipSeason(season)
        }
        entry.autodrain()
      })
  })

function unzipSeason(season) {
  fs.createReadStream('./import-data/upload.zip')
    .pipe(unzipper.Extract({ path: `./import-data/${season}` }))
    .on('close', () => {
      console.log(`Season "${season}" unpacked`)
      fs.unlinkSync('./import-data/upload.zip')
      runAll(season)
    })
}

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
}
