const xpath = require('xpath'),
  _at = require('lodash.at'),
  dom = require('xmldom').DOMParser,
  loadFHLFile = require('../lib/filesystem/loadFHLFile'),
  detectSeason = require('../lib/detectSeason'),
  parseScoreTable = require('./games/parseScoreTable'),
  db = require('../server/helpers/db')

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

const penaltiesRowPattern = new RegExp(
  [
    '(?<player>[A-Z]' + '\\' + '. [A-Z]*) ',
    '(?<team>[A-Z0-9]{1,3}) ',
    '' + '\\' + '((?<penalty>[A-Z-]*), ',
    '(?<duration>Minor|Double Minor|Major)',
    '(?<misconduct>, Game Misconduct)*' + '\\' + ') ',
    '(?<minutes>[0-9]{2}):',
    '(?<seconds>[0-9]{2})'
  ].join(''),
  'gm'
)

const lastNameToPlayer = {}

module.exports = {
  run: async () => {
    console.log('###### START GAMES ############')
    if (Object.keys(lastNameToPlayer).length === 0) {
      const dbData = await db('player').select('id', 'lname').then().catch()

      dbData.forEach((r) => {
        const name = r.lname.toLowerCase()
        if (!lastNameToPlayer[name]) {
          lastNameToPlayer[name] = []
        }
        lastNameToPlayer[name].push(r.id)
      })
    }

    const mapLastNameToPlayer = (lastname) => {
      const rows = lastNameToPlayer[lastname.toLowerCase()]
      if (rows && rows.length === 1) {
        return rows[0]
      } else {
        return lastname
      }
    }
    const season = detectSeason()
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
        htmlParts[1].split('<BR>').forEach(async (entry) => {
          const periodSwitch = entry.match(/<B>(Period [123]|Overtime)<\/B>/)
          if (periodSwitch) {
            period++
          } else {
            let goalData = goalRowPattern.exec(entry)
            if (goalData) {
              // it's a goal!
              // id mapping
              // playernames
              let [goalscorer, primaryassist, secondaryassist] = _at(
                goalData.groups,
                ['goalscorer', 'primaryassist', 'secondaryassist']
              ).map((p) => p && mapLastNameToPlayer(p.toLowerCase()))

              // time
              const time = {
                min: parseInt(goalData.groups.min) + (period - 1) * 20,
                sec: parseInt(goalData.groups.sec)
              }

              // score
              score[goalData.groups.team.toLowerCase()]++
              const concedingteam =
                goalData.groups.team.toLowerCase() === home ? away : home

              // situation
              const situation = goalData.groups.pp
                ? 'pp'
                : goalData.groups.sh
                ? 'sh'
                : null

              const tags = []

              const goalId = `${season}-${gameNumber}-${time.min}-${time.sec}`

              const goal = {
                id: goalId,
                season,
                game: gameNumber,
                goalscorer,
                primaryassist,
                secondaryassist,
                score: `${score[home]}:${score[away]}`,
                scoringteam: goalData.groups.team.toLowerCase(),
                concedingteam,
                period,
                minutes: time['min'],
                seconds: time['sec'],
                situation,
                tags: tags.join(',')
              }
              await db('goal')
                .insert(goal)
                .onConflict()
                .ignore()
                .then()
                .catch((e) => console.log(e))
            }

            let myArray
            while ((myArray = penaltiesRowPattern.exec(entry)) !== null) {
              // console.log('pen', myArray.groups)
            }
          }
        })

        // next game
        gameNumber = gameNumber + 100
      }
    } while (gameExists)
    console.log('###### END GAMES ############')
  }
}
