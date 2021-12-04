const loadFHLFile = require('../../lib/filesystem/loadFHLFile')
const generatePlayerId = require('../../lib/playerId')
const { team, detectSeason } = require('../../lib/functions')
const db = require('../../server/helpers/db')
const log = require('../../server/helpers/logger')

const playerRowPattern = new RegExp(
  [
    '(?<number>[0-9 ]{2}) ',
    "(?<name>[A-Za-z \\-'.]{22}) ",
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
    '(?<df> [0-9]{2}| NA)',
    '(?<sc> [0-9]{2}| NA)',
    '(?<ex> [0-9]{2})',
    '(?<ld> [0-9]{2})',
    '(?<ov> [0-9]{2})'
  ].join('')
)

module.exports = {
  run: async () => {
    const season = detectSeason()
    log(`### ${season} ### STRT ### ROSTER DATA ###`)

    const insertsPlayer = []
    const insertsPlayerdata = []
    let mergeFields = []

    // clean rosterData for this season
    db('playerdata').where('season', season).del()

    let rawHtml = loadFHLFile('Rosters')
    const teams = rawHtml.split('<H2>')
    for (const html of teams) {
      let teamnameRegex = html.match(/>([A-Z]{1,20})</)
      if (teamnameRegex) {
        const teamId = teamnameRegex[1].toLowerCase()
        let players = html.split('\r\n')
        let roster
        for (const playerrow of players) {
          let playerData = playerRowPattern.exec(playerrow)
          if (playerData) {
            for (const [key, value] of Object.entries(playerData.groups)) {
              playerData.groups[key] = value.trim()
            }
            const { name, hand, ...seasonData } = playerData.groups
            const playerId = generatePlayerId(playerData.groups.name)
            const [fname, lname] = name.trim().split(' ', 2)
            // insert to db
            insertsPlayer.push({
              id: playerId,
              fname: fname.toLowerCase(),
              lname: lname.toLowerCase(),
              display_fname: fname,
              display_lname: lname,
              hand
            })
            insertsPlayerdata.push({
              playerid: playerId,
              roster,
              season,
              teamid: team(teamId),
              ...seasonData
            })
            mergeFields = [...Object.keys(seasonData), 'teamid', 'roster']
          } else {
            if (playerrow.indexOf('Pro Roster') > 0) {
              roster = 'pro'
            } else if (playerrow.indexOf('Farm Roster') > 0) {
              roster = 'farm'
            }
          }
        }
      }
    }
    if (insertsPlayer.length > 0) {
      await db('player')
        .insert(insertsPlayer)
        .onConflict()
        .merge(['fname', 'lname', 'hand'])
        .then()
        .catch()
    }
    if (insertsPlayerdata.length > 0) {
      await db('playerdata')
        .insert(insertsPlayerdata)
        .onConflict()
        .merge(mergeFields)
        .then()
        .catch()
    }
    log(`### ${season} ### DONE ### ROSTER DATA ###`)
  }
}
