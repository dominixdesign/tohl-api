const loadFHLFile = require('../../lib/filesystem/loadFHLFile')
const detectSeason = require('../../lib/detectSeason')
const db = require('../../server/helpers/db')
const log = require('../../server/helpers/logger')
const { team } = require('../../lib/team')

const gamePattern = new RegExp(
  [
    '> ',
    '(?<gamenumber>[0-9]+)',
    '[ ]*',
    '(?<away>[A-Z]+)',
    '(?<goalsaway>[0-9 ]*)',
    '(?<home>[A-Z]+)',
    '(?<goalshome>[0-9 ]*)',
    '.[^(]*',
    '(?<ot>\\(OT\\))*'
  ].join('')
)

const gameDayPattern = new RegExp('Day (?<gameday>[0-9]+)')

module.exports = {
  run: async () => {
    const season = detectSeason()
    log(`### ${season} ### STRT ### SCHEDULE ###`)

    let rawHtml = loadFHLFile('Schedule')
    let gameday = 1
    let gameInsert = []
    for (const entry of rawHtml.split('<BR>')) {
      const gameData = gamePattern.exec(entry)
      gamePattern.lastIndex = 0
      if (gameData) {
        const { groups } = gameData
        const goalshome = parseInt(groups.goalshome.trim())
        const goalsaway = parseInt(groups.goalsaway.trim())
        gameInsert.push({
          season,
          game: groups.gamenumber,
          gameday,
          home: team(groups.home),
          away: team(groups.away),
          goalshome,
          goalsaway,
          overtimes: groups.ot ? 1 : null,
          winner:
            goalshome > goalsaway
              ? team(groups.home)
              : goalsaway > goalshome
              ? team(groups.away)
              : null,
          loser:
            goalshome > goalsaway
              ? team(groups.away)
              : goalsaway > goalshome
              ? team(groups.home)
              : null
        })
      } else {
        const dayData = gameDayPattern.exec(entry)
        if (dayData) {
          gameday = dayData.groups.gameday
        }
      }
    }
    if (gameInsert.length > 0) {
      await db('game')
        .insert(gameInsert)
        .onConflict()
        .ignore()
        .then()
        .catch((e) => console.log(e))
    }
    log(`### ${season} ### DONE ### SCHEDULE ###`)
  }
}
