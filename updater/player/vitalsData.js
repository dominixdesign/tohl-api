const loadFHLFile = require('../../lib/filesystem/loadFHLFile')
const writePlayer = require('../../lib/filesystem/writePlayer')
const writeTeamRoster = require('../../lib/filesystem/writeTeamRoster')
const generatePlayerId = require('../../lib/playerId')
const detectSeason = require('../../lib/detectSeason')
const db = require('../../server/helpers/db')

const playerRowPattern = new RegExp(
  [
    '(?<number>[0-9 ]{2}) ',
    '(?<rookie>' + '\\' + '*| {1})',
    '(?<name>[A-Za-z ]{24}) ',
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
  run: () => {
    console.log('###### START VITALS DATA ############')
    const season = detectSeason()
    let rawHtml = loadFHLFile('PlayerVitals')

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
            let {
              name,
              heightf,
              heighti,
              weight,
              rookie,
              salary,
              contract,
              age,
              number,
              ...seasonData
            } = playerData.groups
            rookie = rookie === '*' ? true : false
            salary = salary.replace('.', '')
            weight = Math.round(parseInt(weight) * 0.45359237)
            const height = Math.round(
              parseInt(heightf) * 30.48 + parseInt(heighti) * 2.54
            )
            const playerId = generatePlayerId(playerData.groups.name)
            writePlayer(name, {
              name,
              [season]: { height, weight, rookie, salary, ...seasonData }
            })
            writeTeamRoster(teamId, season, {
              [playerId]: playerData.groups
            })
            if (playerId === 'cedrik_hetterberg') {
              console.log({ playerId, height, weight })
            }
            db('player')
              .insert({
                id: playerId,
                height,
                weight
              })
              .onConflict()
              .merge(['height', 'weight'])
              .then()
              .catch((e) => console.log(e))

            db('playerdata')
              .insert({
                playerid: playerId,
                season,
                rookie,
                salary,
                contract,
                age,
                number
              })
              .onConflict()
              .merge(['rookie', 'salary', 'number', 'contract', 'age'])
              .then()
              .catch((e) => console.log(e))
          }
        })
      }
    })
    console.log('###### VITALS DATA DONE ############')
  }
}
