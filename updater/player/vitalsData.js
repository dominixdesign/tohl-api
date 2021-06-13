const loadFHLFile = require('../../lib/filesystem/loadFHLFile')
const generatePlayerId = require('../../lib/playerId')
const detectSeason = require('../../lib/detectSeason')
const db = require('../../server/helpers/db')
const log = require('../../server/helpers/logger')

const playerRowPattern = new RegExp(
  [
    '(?<number>[0-9 ]{2}) ',
    '(?<rookie>\\*| {1})',
    "(?<name>[A-Za-z \\-'.]{24}) ",
    '(?<pos>LW| C| G| D|RW) ',
    ' +',
    '(?<age>[0-9]{2})  ',
    '(?<heightf>[0-9]{1})',
    ' ft ',
    '(?<heighti>[0-9 ]{2})  ',
    '(?<weight>[0-9]{3})',
    ' lbs ',
    '(?<salary>[0-9 .]{10})   ',
    '(?<contract>[0-9])'
  ].join('')
)

module.exports = {
  run: async () => {
    const season = detectSeason()
    log(`### ${season} ### STRT ### VITALS DATA ###`)
    let rawHtml = loadFHLFile('PlayerVitals')

    const insertsPlayer = []
    const insertsPlayerdata = []

    const teams = rawHtml.split('<H2>')
    for (const html of teams) {
      let teamnameRegex = html.match(/>([A-Z]{1,20})</)
      if (teamnameRegex) {
        // const teamId = teamnameRegex[1].toLowerCase()
        let players = html.split('\r\n')
        players.map((playerrow) => {
          let playerData = playerRowPattern.exec(playerrow)
          if (playerData) {
            for (const [key, value] of Object.entries(playerData.groups)) {
              playerData.groups[key] = value.trim()
            }
            let {
              heightf,
              heighti,
              weight,
              rookie,
              salary,
              contract,
              age,
              number
            } = playerData.groups
            rookie = rookie === '*' ? true : false
            salary = salary.replace('.', '')
            weight = Math.round(parseInt(weight) * 0.45359237)
            const height = Math.round(
              parseInt(heightf) * 30.48 + parseInt(heighti) * 2.54
            )
            const playerId = generatePlayerId(playerData.groups.name)

            insertsPlayer.push({
              id: playerId,
              height,
              weight
            })
            insertsPlayerdata.push({
              playerid: playerId,
              season,
              rookie,
              salary,
              contract,
              age,
              number
            })
          }
        })
      }
    }
    if (insertsPlayer.length > 0) {
      await db('player')
        .insert(insertsPlayer)
        .onConflict()
        .merge(['height', 'weight'])
        .then()
        .catch((e) => console.log('vitalData write player', e))
    }
    if (insertsPlayerdata.length > 0) {
      await db('playerdata')
        .insert(insertsPlayerdata)
        .onConflict()
        .merge(['rookie', 'salary', 'number', 'contract', 'age'])
        .then()
        .catch((e) => console.log('vitalData write playerdata', e))
    }
    log(`### ${season} ### DONE ### VITALS DATA ###`)
  }
}
