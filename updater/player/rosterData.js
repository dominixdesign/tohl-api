const loadFHLFile = require('../../lib/filesystem/loadFHLFile')
const writePlayer = require('../../lib/filesystem/writePlayer')
const writeTeamRoster = require('../../lib/filesystem/writeTeamRoster')
const generatePlayerId = require('../../lib/playerId')
const detectSeason = require('../../lib/detectSeason')
const { run } = require('../../db/init')

const playerRowPattern = new RegExp(
  [
    '(?<number>[0-9 ]{2}) ',
    '(?<name>[A-Za-z ]{22}) ',
    '(?<pos>LW| C| G| D|RW) ',
    '(?<hand>R|L) {2}',
    '(?<cd>OK|[0-9]{2}) ',
    '(?<ij>[A-Z0-9 ]{2})',
    '(?<it> [0-9]{2})',
    '(?<sp> [0-9]{2})',
    '(?<st> [0-9]{2})',
    '(?<en> [0-9]{2})',
    '(?<du> [0-9]{2})',
    '(?<di> [0-9]{2})',
    '(?<sk> [0-9]{2})',
    '(?<pa> [0-9]{2})',
    '(?<pc> [0-9]{2})',
    '(?<df> [0-9]{2})',
    '(?<sc> [0-9]{2})',
    '(?<ex> [0-9]{2})',
    '(?<ld> [0-9]{2})',
    '(?<ov> [0-9]{2})'
  ].join('')
)

module.exports = {
  run: (db) => {
    const season = detectSeason()
    let rawHtml = loadFHLFile('Rosters')

    const teams = rawHtml.split('<H2>')
    teams.map((html) => {
      let teamnameRegex = html.match(/>([A-Z]{1,20})</)
      if (teamnameRegex) {
        const teamId = teamnameRegex[1].toLowerCase()
        let players = html.split('\r\n')
        players.map((playerrow) => {
          let playerData = playerRowPattern.exec(playerrow)
          if (playerData) {
            for (const [key, value] of Object.entries(playerData.groups)) {
              playerData.groups[key] = value.trim()
            }
            const { name, hand, ...seasonData } = playerData.groups
            const playerId = generatePlayerId(playerData.groups.name)
            writePlayer(playerData.groups.name, {
              name,
              hand,
              [season]: seasonData
            })
            writeTeamRoster(teamId, season, {
              [playerId]: playerData.groups
            })

            const [fname, lname] = name.split(' ', 2)
            run('INSERT INTO players VALUES ($playerId, $fname, $lname)', {
              playerId,
              fname: fname.toLowerCase(),
              lname: lname.toLowerCase()
            })
          }
        })
      }
    })
  }
}
