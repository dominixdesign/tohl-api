const loadFHLFile = require('../../lib/filesystem/loadFHLFile')
const db = require('../../server/helpers/db')
const log = require('../../server/helpers/logger')
const { team, detectSeason } = require('../../lib/functions')
const updateStreak = require('./updateStreak')

const gamePatternArray = [
  '> ',
  '(?<gamenumber>[0-9]+)',
  '[ ]*',
  '(?<away>[A-Z]+)',
  '(?<goalsaway>[0-9 ]*)',
  '(?<home>[A-Z]+)',
  '(?<goalshome>[0-9 ]*)',
  '.[^(]*',
  '(?<ot>\\(OT\\))*'
]
const gamePattern = new RegExp(gamePatternArray.join(''))

const gamePOPattern = new RegExp(
  ['PLF-R(?<round>[1-4])-[0-9]{1,2}.html', ...gamePatternArray].join('')
)

const schedulePattern = new RegExp(
  [
    '(?<gamenumber>[0-9]+)',
    '[ ]*',
    '(?<away>[A-Z]+)',
    ' at ',
    '(?<home>[A-Z]+)'
  ].join('')
)

const gameDayPattern = new RegExp('Day (?<gameday>[0-9]+)')
const roundPattern = new RegExp('<round>(?<round>[0-9]+)</round>')

module.exports = {
  run: async () => {
    const season = detectSeason()
    const isPlayoff = season.includes('PLF')
    log(`### ${season} ### STRT ### SCHEDULE ###`)

    const defaultTeamstats = Object.freeze({
      season,
      games: 0,
      wins: 0,
      loss: 0,
      ties: 0,
      points: 0,
      goalsfor: 0,
      goalsagainst: 0,
      diff: 0,
      winp: 0,
      streak: ''
    })

    let rawHtml = ''
    if (isPlayoff) {
      let round = 1
      let rawHtmlPLF = false
      do {
        rawHtmlPLF = loadFHLFile(`-Round${round}-Schedule`)
        if (rawHtmlPLF) {
          rawHtml += `<round>${round}</round><BR>` + rawHtmlPLF
        }
        round++
      } while (round <= 4)
    } else {
      rawHtml = loadFHLFile('Schedule')
    }

    let gameday = 1
    let globalRound = 1
    let gameInsert = []
    let teamstats = {}
    for (const entry of rawHtml.split('<BR>')) {
      let gameData
      if (isPlayoff) {
        gameData = gamePOPattern.exec(entry)
      } else {
        gameData = gamePattern.exec(entry)
      }
      gamePattern.lastIndex = 0
      if (gameData) {
        const { groups } = gameData
        const home = team(groups.home)
        const away = team(groups.away)
        if (home === away) {
          continue
        }
        const overtimes = groups.ot ? 1 : null
        let winner = null,
          loser = null
        if (!teamstats[home]) {
          teamstats[home] = Object.assign({ teamid: home }, defaultTeamstats)
        }
        if (!teamstats[away]) {
          teamstats[away] = Object.assign({ teamid: away }, defaultTeamstats)
        }
        const goalshome = parseInt(groups.goalshome.trim())
        const goalsaway = parseInt(groups.goalsaway.trim())
        teamstats[home].games++
        teamstats[away].games++

        teamstats[home].goalsfor += goalshome
        teamstats[away].goalsfor += goalsaway
        teamstats[home].goalsagainst += goalsaway
        teamstats[away].goalsagainst += goalshome
        teamstats[home].diff =
          teamstats[home].goalsfor - teamstats[home].goalsagainst
        teamstats[away].diff =
          teamstats[away].goalsfor - teamstats[away].goalsagainst
        if (goalshome > goalsaway) {
          teamstats[home].wins++
          teamstats[away].loss++
          teamstats[home].points += 2
          if (overtimes) {
            teamstats[away].points++
          }
          winner = home
          loser = away
        } else if (goalshome < goalsaway) {
          teamstats[away].wins++
          teamstats[home].loss++
          teamstats[away].points += 2
          if (overtimes) {
            teamstats[home].points++
          }
          winner = away
          loser = home
        } else if (goalshome === goalsaway) {
          teamstats[away].ties++
          teamstats[home].ties++
          teamstats[away].points++
          teamstats[home].points++
        }
        teamstats[home].streak = updateStreak(
          home,
          teamstats[home].streak,
          winner
        )
        teamstats[away].streak = updateStreak(
          away,
          teamstats[away].streak,
          winner
        )
        teamstats[home].winp =
          teamstats[home].points / 2 / teamstats[home].games
        teamstats[away].winp =
          teamstats[away].points / 2 / teamstats[away].games

        const gameNumberDB = isPlayoff
          ? `${groups.round}${groups.gamenumber.toString().padStart(2, '0')}`
          : groups.gamenumber

        if (isPlayoff) {
          globalRound = groups.round
        }

        gameInsert.push({
          season,
          game: gameNumberDB,
          gameday,
          round: isPlayoff ? groups.round : null,
          home,
          away,
          goalshome,
          goalsaway,
          overtimes,
          winner,
          loser
        })
      } else {
        const dayData = gameDayPattern.exec(entry)
        const roundData = roundPattern.exec(entry)
        if (roundData) {
          globalRound = roundData.groups.round
        } else if (dayData) {
          gameday = isPlayoff
            ? `${globalRound}${dayData.groups.gameday
                .toString()
                .padStart(2, '0')}` //
            : dayData.groups.gameday
        } else {
          if (entry.indexOf('strike') === -1) {
            const gameData = schedulePattern.exec(entry)
            if (gameData) {
              const { groups } = gameData
              const home = team(groups.home)
              const away = team(groups.away)
              gameInsert.push({
                season,
                game: groups.gamenumber,
                gameday,
                home,
                away
              })
            }
          }
        }
      }
    }

    if (Object.keys(teamstats).length > 0) {
      await db('teamstats')
        .insert(Object.values(teamstats))
        .onConflict()
        .merge()
        .then()
        .catch((e) => console.log(e))
    }
    if (gameInsert.length > 0) {
      await db('game')
        .insert(gameInsert)
        .onConflict()
        .merge()
        .then()
        .catch((e) => console.log(e))
    }
    log(`### ${season} ### DONE ### SCHEDULE ###`)
  }
}
