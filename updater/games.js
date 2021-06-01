const xpath = require('xpath'),
  dom = require('xmldom').DOMParser,
  generatePlayerId = require('../lib/playerId'),
  loadFHLFile = require('../lib/filesystem/loadFHLFile'),
  detectSeason = require('../lib/detectSeason'),
  { team } = require('../lib/team'),
  parseScoreTable = require('./games/parseScoreTable'),
  db = require('../server/helpers/db'),
  log = require('../server/helpers/logger')

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
    '(?<player>[A-Z]' + '\\' + '. [A-Z-]*) ',
    '(?<team>[A-Z0-9]{1,3}) ',
    '' + '\\' + '((?<penalty>[A-Z-]*)(, )*',
    '(?<duration>Minor|Double Minor|Major)*',
    '(?<misconduct>, Misconduct)*',
    '(?<gamemisconduct>, Game Misconduct)*' + '\\' + ') ',
    '(?<min>[0-9]{2}):',
    '(?<sec>[0-9]{2})'
  ].join(''),
  'gm'
)

const rosterPattern = new RegExp(
  [
    '(?<player>[a-zA-Z- ]{21})',
    '(?<goals>[0-9 ]{3})',
    '(?<assists>[0-9 ]{3})',
    '(?<pts>[0-9 ]{3})',
    '(?<plumi>[0-9-+Even ]{6})',
    '(?<pim>[0-9 ]{4})',
    '(?<shts>[0-9 ]{3})',
    '(?<hits>[0-9 ]{4})',
    '(?<it>[0-9 ]{2})'
  ].join(''),
  'gm'
)

const durations = {
  Minor: 2,
  Mayor: 5,
  fighting: 0,
  'Double Minor': 4
}

module.exports = {
  run: async () => {
    log('###### START GAMES ############')

    const season = detectSeason()
    let gameNumber = 0
    let gameExists = true

    do {
      gameNumber = gameNumber + 238
      const insertGoals = []

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
          .map(team)

        gamedata.home = home
        gamedata.away = away

        // parse shots and goals
        const shots = parseScoreTable(doc, home, away, '1')
        const goals = parseScoreTable(doc, home, away, '3')

        gamedata.shots = shots
        gamedata.score = goals

        // split HTML in four parts (INtro, Scoring, TeamAway, TeamHome + Farm)
        const htmlParts = rawHtml.split('<BR><BR>')

        const teamRoster = {
          [home]: {
            goals: {},
            assists: {},
            pim: {}
          },
          [away]: {
            goals: {},
            assists: {},
            pim: {}
          }
        }
        const teamHtml = {
          [home]: htmlParts[3],
          [away]: htmlParts[2]
        }
        for (let team of [home, away]) {
          let rosterArray
          while ((rosterArray = rosterPattern.exec(teamHtml[team])) !== null) {
            if (rosterArray.groups.player) {
              const name = rosterArray.groups.player.trim()
              if (rosterArray.groups.goals > 0) {
                teamRoster[team]['goals'][name.split(' ')[1].toLowerCase()] =
                  generatePlayerId(name)
              }
              if (rosterArray.groups.assists > 0) {
                teamRoster[team]['assists'][name.split(' ')[1].toLowerCase()] =
                  generatePlayerId(name)
              }
              if (rosterArray.groups.pim > 0) {
                teamRoster[team]['pim'][
                  name.split(' ')[0].substr(0, 1).toLowerCase() +
                    '_' +
                    name.split(' ')[1].toLowerCase()
                ] = generatePlayerId(name)
              }
            }
          }
        }

        gamedata.goals = []
        gamedata.penalties = []

        // parse game events
        let period = 0,
          score = {
            [home]: 0,
            [away]: 0
          }
        // go through periods
        for (const entry of htmlParts[1].split('<BR>')) {
          const periodSwitch = entry.match(/<B>(Period [123]|Overtime)<\/B>/)
          if (periodSwitch) {
            period++
          } else {
            let goalData = goalRowPattern.exec(entry)
            goalRowPattern.lastIndex = 0
            if (goalData) {
              // it's a goal!
              // id mapping
              // playernames
              const tags = []

              const goalscorer =
                teamRoster[team(goalData.groups.team)]['goals'][
                  goalData.groups.goalscorer.toLowerCase()
                ]
              const primaryassist = goalData.groups.primaryassist
                ? teamRoster[team(goalData.groups.team)]['assists'][
                    goalData.groups.primaryassist.toLowerCase()
                  ]
                : null
              const secondaryassist = goalData.groups.secondaryassist
                ? teamRoster[team(goalData.groups.team)]['assists'][
                    goalData.groups.secondaryassist.toLowerCase()
                  ]
                : null

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

              if (goalData.groups.team.toLowerCase() === home) {
                tags.push('home')
              } else {
                tags.push('away')
              }

              if (score[home] === score[away]) {
                tags.push('tying')
              }

              if (score[concedingteam] === 0) {
                tags.push('first')
              }

              const goalId = `${season}-${gameNumber}-${time.min}-${time.sec}`

              insertGoals.push({
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
              })
            }

            if (insertGoals.length > 0) {
              await db('goal')
                .insert(insertGoals)
                .onConflict()
                .ignore()
                .then()
                .catch((e) => console.log(e))
            }

            const insertPenalty = []
            const filterMatches = [...entry.matchAll(penaltiesRowPattern)] || []
            for (const penaltyData of filterMatches) {
              const time = {
                min: parseInt(penaltyData.groups.min) + (period - 1) * 20,
                sec: parseInt(penaltyData.groups.sec)
              }
              const player =
                teamRoster[team(penaltyData.groups.team)]['pim'][
                  penaltyData.groups.player.toLowerCase().replace('. ', '_')
                ]
              const tags = []
              if (penaltyData.groups.misconduct) {
                tags.push('misconduct')
              }
              if (penaltyData.groups.gamemisconduct) {
                tags.push('gamemisconduct')
              }

              insertPenalty.push({
                id: `${season}-${gameNumber}-${time.min}-${time.sec}`,
                season,
                game: gameNumber,
                player,
                team: penaltyData.groups.team.toLowerCase(),
                period,
                minutes: time['min'],
                seconds: time['sec'],
                length:
                  durations[
                    penaltyData.groups.duration ||
                      penaltyData.groups.penalty.toLowerCase()
                  ],
                offense: penaltyData.groups.penalty.toLowerCase(),
                tags: tags.join(',')
              })
            }
            if (insertPenalty.length > 0) {
              await db('penalty')
                .insert(insertPenalty)
                .onConflict()
                .ignore()
                .then()
                .catch((e) => console.log(e))
            }
          }
        }
      }
    } while (gameExists)
    log('###### END GAMES ############')
  }
}
