const { detectSeason } = require('../../lib/functions')
const detectGameday = require('../../lib/detectGameday')
const db = require('../../server/helpers/db')
const log = require('../../server/helpers/logger')

module.exports = {
  run: async () => {
    const season = detectSeason()
    const isPlayoff = season.includes('PLF')
    if (isPlayoff) {
      log(`___ ${season} ___ SKIP ___ PLAYER PAYMENTS ___`)
      return
    }
    log(`### ${season} ### STRT ### PLAYER PAYMENTS ###`)

    const gameDays = await db('game')
      .where('season', season)
      .max('gameday as lastGameday')
    const lastGameday = gameDays[0].lastGameday
    const gameday = detectGameday()

    const allPlayerArray = await db('playerdata')
      .where('season', season)
      .select('playerid', 'teamid', 'season', 'salary')

    await db('player_payments')
      .insert(
        allPlayerArray.map((p) => ({
          player: p.playerid,
          team: p.teamid,
          season,
          gameday,
          payment: parseInt(p.salary / lastGameday)
        }))
      )
      .onConflict()
      .merge()
      .then()
      .catch()

    log(`### ${season} ### DONE ### PLAYER PAYMENTS ###`)
  }
}
