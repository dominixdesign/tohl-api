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
    "(?<goalscorer>[A-Z-']+) ",
    '[0-9]+ ',
    "\\((?<primaryassist>[A-Z-']+)",
    "(, (?<secondaryassist>[A-Z-']+))*\\) *",
    '(?<pp>\\(PP\\))*',
    '(?<sh>\\(SH\\))*',
    ', ',
    '(?<min>[0-9]{2})',
    ':',
    '(?<sec>[0-9]{2})'
  ].join('')
)

const penaltiesRowPattern = new RegExp(
  [
    "(?<player>[A-Z]\\. [A-Z-']*) ",
    '(?<team>[A-Z0-9]{1,3}) ',
    '\\((?<penalty>[A-Z-]*)(, )*',
    '(?<duration>Minor|Double Minor|Major)*',
    '(?<misconduct>, Misconduct)*',
    '(?<gamemisconduct>, Game Misconduct)*\\) ',
    '(?<min>[0-9]{2}):',
    '(?<sec>[0-9]{2})'
  ].join(''),
  'gm'
)

const rosterPattern = new RegExp(
  [
    "(?<player>[a-zA-Z- .']{21})",
    '(?<goals>[0-9 ]{3})',
    '(?<assists>[0-9 ]{3})',
    '(?<points>[0-9 ]{3})',
    '(?<plusminus>[0-9-+Even ]{6})',
    '(?<pim>[0-9 ]{4})',
    '(?<shots>[0-9 ]{3})',
    '(?<hits>[0-9 ]{4})',
    '(?<icetime>[0-9 ]{2})'
  ].join(''),
  'gm'
)

const goaliePattern = new RegExp(
  [
    "(?<player>[a-zA-Z- .']*) \\(",
    '(?<team>[A-Z0-9 ]{3})\\), ',
    '(?<saves>[0-9]+) saves out of ',
    '(?<shotsfaced>[0-9]+) shots',
    '(?<win>[,WL ]*)'
  ].join(''),
  'gm'
)

const durations = {
  Minor: 2,
  Mayor: 5,
  fighting: 5,
  'Double Minor': 4
}

module.exports = {
  run: async () => {
    const season = detectSeason()
    log(`### ${season} ### STRT ### GAME DETAILS ###`)

    const isPlayoff = season.includes('PLF')
    let round = 1
    let gameNumber = 1
    let gameExists = true

    const insertGoals = []
    const insertGoalies = []
    const insertLineup = []
    const insertPenalty = []
    const updateGame = []
    const teamstats = {}

    do {
      let periods = 0

      let rawHtml = false
      if (isPlayoff) {
        let rawHtmlPLF = false
        do {
          rawHtmlPLF = loadFHLFile(`-R${round}-${gameNumber}`)
          if (rawHtmlPLF === false && round < 4) {
            round++
            gameNumber = 1
          } else {
            rawHtml = rawHtmlPLF
            rawHtmlPLF = true
          }
        } while (rawHtmlPLF === false)
      } else {
        rawHtml = loadFHLFile('' + gameNumber)
      }

      if (rawHtml === false) {
        gameExists = false
      } else {
        const gameNumberDB = isPlayoff
          ? `${round}${gameNumber.toString().padStart(2, '0')}`
          : gameNumber
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

        const pim = { [home]: 0, [away]: 0 }
        // parse shots and goals
        const shots = parseScoreTable(doc, home, away, '1')
        const goals = parseScoreTable(doc, home, away, '3')

        gamedata.shots = shots
        gamedata.score = goals
        let gamewinner
        if (goals[home].total > goals[away].total) {
          gamewinner = parseInt(goals[away].total) + 1
        } else if (goals[home].total < goals[away].total) {
          gamewinner = parseInt(goals[home].total) + 1
        }

        let gameTime = goals[home].total === goals[away].total ? 65 : 60

        // split HTML in four parts (INtro, Scoring, TeamAway, TeamHome + Farm)
        const htmlParts = rawHtml.split('<BR><BR>')

        // begin injured players
        const injuredPlayers = {}
        const injuredPlayersMatches =
          [
            ...htmlParts[3].matchAll(
              /(?<player>[a-zA-Z- .']+) injured at (?<min>[0-9]{2}):(?<sec>[0-9]{2}) of the (?<period>[0-9])/gm
            )
          ] || []
        for (const { groups } of injuredPlayersMatches) {
          injuredPlayers[generatePlayerId(groups.player)] = `${
            parseInt(groups.min) + (parseInt(groups.period) - 1) * 20
          }:${parseInt(groups.sec)}`
        }
        // end injured players

        // begin ejected players
        const ejectedPlayers = {}
        const ejectedPlayersMatches =
          [
            ...htmlParts[3].matchAll(
              /(?<player>[a-zA-Z- .']+) ejected at (?<min>[0-9]{2}):(?<sec>[0-9]{2}) of the (?<period>[0-9])/gm
            )
          ] || []
        for (const { groups } of ejectedPlayersMatches) {
          ejectedPlayers[generatePlayerId(groups.player)] = `${
            parseInt(groups.min) + (parseInt(groups.period) - 1) * 20
          }:${parseInt(groups.sec)}`
        }
        // end ejected players

        // begin entered goalies
        const enteredGoalies = {}
        const enteredGoaliesMatches =
          [
            ...htmlParts[3].matchAll(
              /(?<player>[a-zA-Z- .']*) enters game at (?<min>[0-9]{2}):(?<sec>[0-9]{2}) of (?<period>[123])/gm
            )
          ] || []
        for (const { groups } of enteredGoaliesMatches) {
          enteredGoalies[generatePlayerId(groups.player)] =
            parseInt(groups.min) +
            (parseInt(groups.period) - 1) * 20 +
            (parseInt(groups.sec) > 0 ? 1 : 0)
        }
        // end entered goalies

        // begin three stars
        const threeStars = {}
        const threeStarsMatches =
          [
            ...htmlParts[1].matchAll(
              / (?<star>[1-3]) - (?<player>[a-zA-Z- .']*)\((?<team>[A-Z0-9 ]{3})/gm
            )
          ] || []
        for (const { groups } of threeStarsMatches) {
          threeStars[generatePlayerId(groups.player)] =
            groups.star === '1'
              ? 'first'
              : groups.star === '2'
              ? 'second'
              : groups.star === '3'
              ? 'third'
              : null
        }
        // end three stars

        // begin fighting stats
        const fightsWon = {}
        const fightsLose = {}
        const fightsDraw = {}
        const fightersMatches =
          [
            ...htmlParts[3].matchAll(
              /(?<winner>[a-zA-Z- .']+) beats up (?<loser>[a-zA-Z- .']+)|(?<draw1>[a-zA-Z- .']+) and (?<draw2>[a-zA-Z- .']+) fight to a draw/gm
            )
          ] || []
        const setFight = (input, player) => {
          input[player] = !input[player] ? 1 : input[player]++
          return input
        }
        for (const { groups } of fightersMatches) {
          if (groups.winner) {
            setFight(fightsWon, generatePlayerId(groups.winner))
            setFight(fightsLose, generatePlayerId(groups.loser))
          }
          if (groups.draw1) {
            setFight(fightsDraw, generatePlayerId(groups.draw1))
            setFight(fightsDraw, generatePlayerId(groups.draw2))
          }
        }
        // end fighting stats

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
        // start goalies
        const goalieMatches = [...htmlParts[1].matchAll(goaliePattern)] || []
        for (const { groups } of goalieMatches) {
          const playerId = generatePlayerId(groups.player)
          const name = groups.player.toLowerCase().split(' ')
          const teamId = team(groups.team)
          insertGoalies.push({
            player: playerId,
            season,
            team: teamId,
            injured: injuredPlayers[playerId],
            ejected: ejectedPlayers[playerId],
            star: threeStars[playerId],
            game: gameNumberDB,
            saves: groups.saves,
            shotsfaced: groups.shotsfaced,
            goalsagainst: parseInt(groups.shotsfaced) - parseInt(groups.saves)
          })
          teamRoster[teamId]['assists'][name[1].replace('v.', '')] = playerId
          teamRoster[teamId]['pim'][name[1].replace('v.', '')] = playerId
          teamRoster[teamId]['goals'][name[1].replace('v.', '')] = playerId

          // calculate minutes
        }
        // end goalies

        const teamHtml = {
          [home]: htmlParts[3],
          [away]: htmlParts[2]
        }
        for (let team of [home, away]) {
          const filterMatches =
            [...teamHtml[team].matchAll(rosterPattern)] || []
          for (const rosterArray of filterMatches) {
            if (rosterArray.groups.player) {
              Object.keys(rosterArray.groups).map(function (key) {
                rosterArray.groups[key] = rosterArray.groups[key]
                  .trim()
                  .toLowerCase()
              })
              const playerId = generatePlayerId(rosterArray.groups.player)
              const name = rosterArray.groups.player.split(' ')
              const playerRow = {
                ...rosterArray.groups,
                season,
                team,
                injured: injuredPlayers[playerId],
                ejected: ejectedPlayers[playerId],
                game: gameNumberDB,
                player: playerId,
                star: threeStars[playerId],
                fightswon: fightsWon[playerId],
                fightslose: fightsLose[playerId],
                fightsdraw: fightsDraw[playerId],
                plusminus:
                  rosterArray.groups.plusminus === 'even'
                    ? 0
                    : rosterArray.groups.plusminus
              }
              insertLineup.push(playerRow)

              if (rosterArray.groups.goals > 0) {
                teamRoster[team]['goals'][
                  name[name.length - 1].replace('v.', '')
                ] = playerId
              }
              if (rosterArray.groups.assists > 0) {
                teamRoster[team]['assists'][
                  name[name.length - 1].replace('v.', '')
                ] = playerId
              }
              pim[team] += parseInt(rosterArray.groups.pim)
              if (rosterArray.groups.pim > 0) {
                teamRoster[team]['pim'][
                  name[0].substr(0, 1) +
                    '_' +
                    name[name.length - 1].replace('v.', '')
                ] = playerId
              }
            }
          }
        }

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
            periods++
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

              if (period > 3) {
                gameTime = time.min + (time.sec > 0 ? 1 : 0)
              }

              // score
              score[team(goalData.groups.team)]++
              const concedingteam =
                goalData.groups.team.toLowerCase() === home ? away : home

              // situation
              const situation = goalData.groups.pp
                ? 'pp'
                : goalData.groups.sh
                ? 'sh'
                : null

              if (team(goalData.groups.team) === home) {
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
              if (score[team(goalData.groups.team)] === gamewinner) {
                tags.push('gamewinner')
              }

              insertGoals.push({
                season,
                game: gameNumberDB,
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
                season,
                game: gameNumberDB,
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
          }
        }

        // start goalies
        for (const goalie of insertGoalies) {
          goalie.assists = insertGoals.filter(
            (g) =>
              g.primaryassist === goalie.player ||
              g.secondaryassist === goalie.player
          ).length
          goalie.goals = insertGoals.filter(
            (g) => g.goalscorer === goalie.player
          ).length
          goalie.pim = insertPenalty
            .filter((g) => g.player === goalie.player)
            .reduce((prev, curr) => prev + curr, 0)
          if (!goalie.minutes) {
            if (enteredGoalies[goalie.player]) {
              goalie.minutes = gameTime - enteredGoalies[goalie.player]
              for (const otherGoalie of insertGoalies) {
                if (
                  otherGoalie.team === goalie.team &&
                  otherGoalie.player !== goalie.player
                ) {
                  otherGoalie.minutes = enteredGoalies[goalie.player]
                }
              }
            } else {
              goalie.minutes = gameTime
              if (goalie.goalsagainst === 0) {
                goalie.shutout = 1
              }
            }
          }
        }

        // end goalies

        const powerplay = {
          [home]: {
            situations: 0,
            goals: 0
          },
          [away]: {
            situations: 0,
            goals: 0
          }
        }
        const powerplayMatches =
          [
            ...htmlParts[1].matchAll(
              /(?<team>[A-Z]+) {2}(?<ppgoals>[0-9]+) for (?<ppsits>[0-9]+)/gm
            )
          ] || []
        for (const { groups } of powerplayMatches) {
          powerplay[team(groups.team)].situations = groups.ppsits
          powerplay[team(groups.team)].goals = groups.ppgoals
        }

        updateGame.push({
          season,
          game: gameNumber,
          overtimes: periods > 3 ? periods - 3 : null,
          shotshome: gamedata.shots[home].total,
          shotsaway: gamedata.shots[away].total,
          pphome: powerplay[home].situations,
          ppaway: powerplay[away].situations,
          ppghome: powerplay[home].goals,
          ppgaway: powerplay[away].goals,
          gamedata: JSON.stringify(gamedata)
        })

        for (const team of [home, away]) {
          const opponent = team === home ? away : home
          if (!teamstats[team]) {
            teamstats[team] = {
              season,
              teamid: team,
              pp: 0,
              ppg: 0,
              pk: 0,
              pkg: 0,
              pim: 0,
              shotsfor: 0,
              shotsagainst: 0
            }
          }

          teamstats[team].pp += parseInt(powerplay[team].situations)
          teamstats[team].ppg += parseInt(powerplay[team].goals)
          teamstats[team].pk += parseInt(powerplay[opponent].situations)
          teamstats[team].pkg += parseInt(powerplay[opponent].goals)
          teamstats[team].shotsfor += parseInt(gamedata.shots[team].total)
          teamstats[team].shotsagainst += parseInt(
            gamedata.shots[opponent].total
          )
          teamstats[team].pim += parseInt(pim[team])
        }
      }

      gameNumber = parseInt(gameNumber) + 5
    } while (gameExists)

    // log('insert lineup')
    if (insertLineup.length > 0) {
      await db('lineup')
        .insert(insertLineup)
        .onConflict()
        .merge()
        .then()
        .catch((e) => console.log(e))
    }
    // log('insert lineup 2')
    if (insertGoalies.length > 0) {
      await db('lineup')
        .insert(insertGoalies)
        .onConflict()
        .merge()
        .then()
        .catch((e) => console.log(e))
    }

    // log('insert goals')
    if (insertGoals.length > 0) {
      await db('goal')
        .insert(insertGoals)
        .onConflict()
        .merge()
        .then()
        .catch((e) => console.log(e))
    }
    // log('insert penalties')
    if (insertPenalty.length > 0) {
      await db('penalty')
        .insert(insertPenalty)
        .onConflict()
        .merge()
        .then()
        .catch((e) => console.log(e))
    }
    // log('update game')
    if (updateGame.length > 0) {
      await db('game')
        .insert(updateGame)
        .onConflict()
        .merge()
        .then()
        .catch((e) => console.log(e))
    }

    if (teamstats) {
      await db('teamstats')
        .insert(Object.values(teamstats))
        .onConflict()
        .merge()
        .then()
        .catch((e) => console.log(e))
    }
    log(`### ${season} ### DONE ### GAME DETAILS ###`)
  }
}
