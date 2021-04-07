const fs = require('fs'),
  xpath = require('xpath'),
  dom = require('xmldom').DOMParser,
  loadFHLFile = require('../lib/filesystem/loadFHLFile'),
  playerId = require('../lib/playerId'),
  parseScoreTable = require('./games/parseScoreTable')

let rawdata = fs.readFileSync('./api/playerlastnames.json')
let playersByLastname = JSON.parse(rawdata)

const goalRowPattern = new RegExp(
  [
    '[0-9]{1,2}. ',
    '(?<team>[A-Z]+), ',
    '(?<goalscorer>[A-Z]+) ',
    '[0-9]+ ',
    '' + '\\' + '((?<primaryassist>[A-Z]+)',
    '(, (?<secondaryassist>[A-Z]+))*' + '\\' + ') *',
    '(?<pp>' + '\\' + '(PP' + '\\' + '))*',
    '(?<sh>' + '\\' + '(SH' + '\\' + '))*',
    ', ',
    '(?<min>[0-9]{2})',
    ':',
    '(?<sec>[0-9]{2})'
  ].join('')
)

const mapLastNameToPlayer = (lastname) => {
  if (!playersByLastname[lastname]) {
    return lastname
  }
  if (playersByLastname[lastname].length === 1) {
    return playerId(playersByLastname[lastname][0].name)
  }
  if (playersByLastname[lastname].length > 1) {
    // TODO check if only one player is on the roster for this team in this game
    return lastname
  }
}

module.exports = {
  run: () => {
    let gameNumber = 1
    let gameExists = true

    do {
      let rawHtml = loadFHLFile('' + gameNumber)
      if (rawHtml === false) {
        gameExists = false
      } else {
        //cleanup html
        //rawHtml = rawHtml.replace('<FONT SIZE -1>', '')
        const doc = new dom({
          errorHandler: {
            warning: () => {}
          }
        }).parseFromString(rawHtml)

        // parse home and away team
        const [away, home] = xpath
          .select('string(//H3)', doc)
          .toLowerCase()
          .split(' at ')

        // parse shots and goals
        const shots = parseScoreTable(doc, home, away, '1')
        const goals = parseScoreTable(doc, home, away, '3')
        console.log({ shots, goals })

        // split HTML in four parts (INtro, Scoring, Team1, Team2 + Farm)
        const htmlParts = rawHtml.split('<BR><BR>')

        // parse game events
        let period = 0,
          score = {
            [home]: 0,
            [away]: 0
          }
        // go through periods
        htmlParts[1].split('<BR>').forEach((entry) => {
          const periodSwitch = entry.match(/<B>(Period [123]|Overtime)<\/B>/)
          if (periodSwitch) {
            period++
          } else {
            let goalData = goalRowPattern.exec(entry)
            if (goalData) {
              // it's a goal!
              // id mapping
              goalData.groups.goalscorer = mapLastNameToPlayer(
                goalData.groups.goalscorer.toLowerCase()
              )
              if (goalData.groups.primaryassist) {
                goalData.groups.primaryassist = mapLastNameToPlayer(
                  goalData.groups.primaryassist.toLowerCase()
                )
              }
              if (goalData.groups.secondaryassist) {
                goalData.groups.secondaryassist = mapLastNameToPlayer(
                  goalData.groups.secondaryassist.toLowerCase()
                )
              }
              score[goalData.groups.team.toLowerCase()]++
              console.log(goalData.groups, score, period)
            }
          }
        })

        // next game
        gameNumber = gameNumber + 100
      }
    } while (gameExists)
  }
}
