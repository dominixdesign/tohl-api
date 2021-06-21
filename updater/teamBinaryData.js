const loadBinaryFHLFile = require('../lib/filesystem/loadBinaryFHLFile')
const detectSeason = require('../lib/detectSeason')
// const db = require('../server/helpers/db')
const log = require('../server/helpers/logger')

const cleaner = (s) =>
  s
    .toString()
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00]/g, '')
    .trim()

module.exports = {
  run: async () => {
    const season = detectSeason()
    log(`### ${season} ### STRT ### TEAM BINARY DATA ###`)

    let rawBinary = loadBinaryFHLFile('.tms')
    let simId = 0
    const updateTeam = {}

    for (let i = 0; i < rawBinary.length; i += 254) {
      const data = rawBinary.slice(i, i + 255)
      const teamsim = cleaner(data.slice(0, 10)).toLowerCase()
      const gm = cleaner(data.slice(10, 55))
      const id = cleaner(data.slice(61, 64)).toLowerCase()
      const rink = cleaner(data.slice(64, 95))
      const coach = cleaner(data.slice(103, 125))

      if (!updateTeam[teamsim]) {
        updateTeam[teamsim] = {
          id,
          teamsim,
          season,
          simId,
          gm,
          rink,
          coach
        }
      }
      simId++
    }

    console.log(updateTeam)

    log(`### ${season} ### DONE ### TEAM BINARY DATA ###`)
  }
}
