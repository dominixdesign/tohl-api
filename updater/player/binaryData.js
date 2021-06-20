const loadBinaryFHLFile = require('../../lib/filesystem/loadBinaryFHLFile')
const generatePlayerId = require('../../lib/playerId')
const detectSeason = require('../../lib/detectSeason')
// const db = require('../../server/helpers/db')
const log = require('../../server/helpers/logger')

module.exports = {
  run: async () => {
    const season = detectSeason()
    log(`### ${season} ### STRT ### BINARY DATA ###`)

    let rawBinary = loadBinaryFHLFile('.ros')
    let rosterId = 0
    const updatePlayer = []

    for (let i = 0; i < 5000; i += 86) {
      const data = rawBinary.slice(i, i + 86)
      const playerid = generatePlayerId(
        data.slice(0, 22).toString().substr(0, 22).trim()
      )
      const nation = generatePlayerId(
        data.slice(76, 79).toString().substr(0, 22).trim()
      )
      if (playerid !== '') {
        updatePlayer.push({
          playerid,
          rosterId,
          nation
        })
      }
      rosterId++
      if (rosterId >= 50) {
        rosterId = 0
      }
    }

    console.log(updatePlayer)

    log(`### ${season} ### DONE ### BINARY DATA ###`)
  }
}
