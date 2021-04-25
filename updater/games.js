const fs = require('fs'),
  xpath = require('xpath'),
  _at = require('lodash.at'),
  dom = require('xmldom').DOMParser,
  loadFHLFile = require('../lib/filesystem/loadFHLFile'),
  detectSeason = require('../lib/detectSeason'),
  playerId = require('../lib/playerId'),
  parseScoreTable = require('./games/parseScoreTable'),
  writePlayer = require('../lib/filesystem/writePlayer')

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
        const gamedata = {}
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

        gamedata.home = home
        gamedata.away = away

        // parse shots and goals
        const shots = parseScoreTable(doc, home, away, '1')
        const goals = parseScoreTable(doc, home, away, '3')

        gamedata.shots = shots
        gamedata.score = goals

        // split HTML in four parts (INtro, Scoring, Team1, Team2 + Farm)
        const htmlParts = rawHtml.split('<BR><BR>')

        gamedata.goals = []
        gamedata.penalties = []

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
              // playernames
              let [
                goalscorer,
                primaryassist,
                secondaryassist
              ] = _at(goalData.groups, [
                'goalscorer',
                'primaryassist',
                'secondaryassist'
              ]).map((p) => p && mapLastNameToPlayer(p.toLowerCase()))

              // time
              const time = {
                min: parseInt(goalData.groups.min) + (period - 1) * 20,
                sec: parseInt(goalData.groups.sec)
              }

              // score
              score[goalData.groups.team.toLowerCase()]++

              // situation
              const situation = goalData.groups.pp
                ? 'pp'
                : goalData.groups.sh
                ? 'sh'
                : null

              const goalId = `${gameNumber}-${time.min}-${time.sec}`
              const goal = {
                goalscorer,
                primaryassist,
                secondaryassist,
                score,
                period,
                time,
                situation
              }

              gamedata.goals.push(goal)

              // write players
              if (goalscorer.includes('_')) {
                writePlayer(
                  goalscorer,
                  { [goalId]: goal },
                  detectSeason(),
                  'goals'
                )
              }
              if (primaryassist.includes('_')) {
                writePlayer(
                  primaryassist,
                  { [goalId]: goal },
                  detectSeason(),
                  'assists'
                )
              }
              if (secondaryassist && secondaryassist.includes('_')) {
                writePlayer(
                  secondaryassist,
                  { [goalId]: goal },
                  detectSeason(),
                  'assists'
                )
              }
            }
          }
        })

        // next game
        gameNumber = gameNumber + 100
      }
    } while (gameExists)
  }
}
