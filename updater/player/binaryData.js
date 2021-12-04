const loadBinaryFHLFile = require('../../lib/filesystem/loadBinaryFHLFile')
const generatePlayerId = require('../../lib/playerId')
const { detectSeason } = require('../../lib/functions')
const db = require('../../server/helpers/db')
const log = require('../../server/helpers/logger')

module.exports = {
  run: async () => {
    const season = detectSeason()
    log(`### ${season} ### STRT ### PLAYER BINARY DATA ###`)

    let rawBinary = loadBinaryFHLFile('.ros')
    let simId = 0
    const updatePlayerData = []
    const updatePlayer = []

    for (let i = 0; i < rawBinary.length; i += 86) {
      const data = rawBinary.slice(i, i + 86)
      const playerid = generatePlayerId(
        data.slice(0, 22).toString().substr(0, 22).trim()
      )
      const nation = generatePlayerId(
        data.slice(76, 79).toString().substr(0, 22).trim()
      )
      if (playerid !== '') {
        updatePlayerData.push({
          playerid,
          season,
          simId
        })
        updatePlayer.push({
          id: playerid,
          nation
        })
      }
      simId++
      if (simId >= 50) {
        simId = 0
      }
    }

    if (updatePlayer.length > 0) {
      await db('player')
        .insert(updatePlayer)
        .onConflict()
        .merge(['nation'])
        .then()
        .catch()
    }
    if (updatePlayerData.length > 0) {
      await db('playerdata')
        .insert(updatePlayerData)
        .onConflict()
        .merge(['simId'])
        .then()
        .catch()
    }

    log(`### ${season} ### DONE ### PLAYER BINARY DATA ###`)
  }
}
