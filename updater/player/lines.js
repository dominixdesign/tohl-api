const loadFHLFile = require('../../lib/filesystem/loadFHLFile')
const generatePlayerId = require('../../lib/playerId')
const { team, detectSeason } = require('../../lib/functions')
const detectGameday = require('../../lib/detectGameday')
const db = require('../../server/helpers/db')
const log = require('../../server/helpers/logger')

const linesPattern = new RegExp(
  [
    ' [1-4]  ',
    "(?<player1>[A-Za-z \\-'.]{22})",
    "(?<player2>[A-Za-z \\-'.]{22})",
    "(?<player3>[A-Za-z \\-'.]{22})",
    "(?<player4>[A-Za-z \\-'.]{22})*",
    "(?<player5>[A-Za-z \\-'.]*)"
  ].join(''),
  'gm'
)

const lt = ['ES', 'PP', 'PK']

module.exports = {
  run: async () => {
    const season = detectSeason()
    log(`### ${season} ### STRT ### LINES ###`)

    const gameday = detectGameday()

    // get gameids for current gameday
    const gameIds = {}
    const games = await db('game')
      .select('game', 'home', 'away')
      .where({ gameday, season })
    for (const game of games) {
      gameIds[team(game.home)] = game.game
      gameIds[team(game.away)] = game.game
    }
    const players = {}
    let rawHtml = loadFHLFile('Lines')
    const teams = rawHtml.split('<H2>')
    for (const html of teams) {
      let teamnameRegex = html.match(/>([A-Z]{1,20})</)
      if (teamnameRegex) {
        const teamId = team(teamnameRegex[1])
        const lineTypes = html.split('<BR><BR>')
        let ltt = 0
        for (const lineType of lineTypes) {
          let row = 1
          const linesMatches = [...lineType.matchAll(linesPattern)] || []
          for (const lineData of linesMatches) {
            for (const pl of Object.values(lineData.groups)) {
              if (pl && gameIds[teamId]) {
                if (!players[generatePlayerId(pl)]) {
                  const playerId = generatePlayerId(pl)
                  players[playerId] = {
                    player: playerId,
                    season,
                    game: gameIds[teamId],
                    line: []
                  }
                }
                players[generatePlayerId(pl)].line.push(`${lt[ltt]}${row}`)
              }
            }
            row++
          }
          ltt++
        }
      }
    }

    await db('lineup')
      .insert(
        Object.values(players).map((p) => ({ ...p, line: p.line.join(',') }))
      )
      .onConflict()
      .merge(['line'])
      .then()
      .catch((e) => console.log(e))

    // cleanup lineup to remove invalid lines without team
    // await db('lineup')
    //   .where('team', '')
    //   .delete()
    //   .then()
    //   .catch((e) => console.log(e))

    log(`### ${season} ### DONE ### LINES ###`)
  }
}
