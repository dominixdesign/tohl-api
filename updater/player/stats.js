const detectSeason = require('../../lib/detectSeason')
const db = require('../../server/helpers/db')
const log = require('../../server/helpers/logger')

module.exports = {
  run: async () => {
    const season = detectSeason()
    log(`### ${season} ### STRT ### PLAYER STATS ###`)

    const playerRef = db.ref('lineup.player')
    const seasonRef = db.ref('lineup.season')
    const teamRef = db.ref('lineup.team')

    const ppg = db('goal')
      .count()
      .groupBy('player', 'scoringteam')
      .where('goalscorer', playerRef)
      .where('season', seasonRef)
      .where('scoringteam', teamRef)
      .where('situation', 'pp')
    const ppa = db('goal')
      .count()
      .groupBy('player', 'scoringteam')
      .where(function () {
        this.where('primaryassist', playerRef).orWhere(
          'secondaryassist',
          playerRef
        )
      })
      .where('season', seasonRef)
      .where('scoringteam', teamRef)
      .where('situation', 'pp')
    const shg = db('goal')
      .count()
      .groupBy('player', 'scoringteam')
      .where('goalscorer', playerRef)
      .where('season', seasonRef)
      .where('scoringteam', teamRef)
      .where('situation', 'sh')
    const sha = db('goal')
      .count()
      .groupBy('player', 'scoringteam')
      .where(function () {
        this.where('primaryassist', playerRef).orWhere(
          'secondaryassist',
          playerRef
        )
      })
      .where('season', seasonRef)
      .where('scoringteam', teamRef)
      .where('situation', 'sh')

    const allLineupArray = await db('lineup')
      .where('season', season)
      .select('player', 'team', 'season')
      .count('points as games')
      .sum('goals as goals')
      .sum('assists as assists')
      .sum('points as points')
      .sum('plusminus as plusminus')
      .sum('pim as pim')
      .sum('shots as shots')
      .sum('hits as hits')
      .sum('icetime as icetime')
      .sum('fightswon as fightswon')
      .sum('fightslose as fightslose')
      .sum('fightsdraw as fightsdraw')
      .sum({
        first_stars: db.raw("case when star like 'first' then 1 else 0 end"),
        second_stars: db.raw("case when star like 'second' then 1 else 0 end"),
        third_stars: db.raw("case when star like 'third' then 1 else 0 end")
      })
      .select({ ppg, ppa, shg, sha })
      .sum('minutes as minutes')
      .sum('saves as saves')
      .sum('shotsfaced as shotsfaced')
      .sum('goalsagainst as goalsagainst')
      .count('ejected as ejections')
      .count('injured as injuries')
      .groupBy('player', 'team')

    await db('playerstats')
      .insert(allLineupArray)
      .onConflict()
      .merge()
      .then()
      .catch()

    // streaks
    const allLineups = await db('lineup')
      .where('season', season)
      .select('player', 'team', 'season', 'goals', 'points', 'game')
      .orderBy(['team', 'player', 'game'])

    let currentPlayer = null
    let currentStreak = null
    const updateStreaks = []
    for (const { player, goals, points, team } of allLineups) {
      if (currentPlayer !== player) {
        if (currentStreak !== null) {
          updateStreaks.push({
            ...currentStreak
          })
        }
        currentPlayer = player
        currentStreak = {
          player,
          season,
          team,
          streak_goals_current: 0,
          streak_goals_longest: 0,
          streak_points_current: 0,
          streak_points_longest: 0
        }
      }
      if (goals > 0) {
        currentStreak.streak_goals_current++
        if (
          currentStreak.streak_goals_current >
          currentStreak.streak_goals_longest
        ) {
          currentStreak.streak_goals_longest =
            currentStreak.streak_goals_current
        }
      } else {
        currentStreak.streak_goals_current = 0
      }
      if (points > 0) {
        currentStreak.streak_points_current++
        if (
          currentStreak.streak_points_current >
          currentStreak.streak_points_longest
        ) {
          currentStreak.streak_points_longest =
            currentStreak.streak_points_current
        }
      } else {
        currentStreak.streak_points_current = 0
      }
    }
    await db('playerstats')
      .insert(updateStreaks)
      .onConflict()
      .merge()
      .then()
      .catch()

    log(`### ${season} ### DONE ### PLAYER STATS ###`)
  }
}
