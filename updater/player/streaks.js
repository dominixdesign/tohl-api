const { detectSeason } = require('../../lib/functions')
const db = require('../../server/helpers/db')
const log = require('../../server/helpers/logger')

module.exports = {
  run: async () => {
    const season = detectSeason()
    log(`### ${season} ### STRT ### PLAYER STREAKS ###`)
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
    if (updateStreaks.length > 0) {
      await db('playerstats')
        .insert(updateStreaks)
        .onConflict()
        .merge()
        .then()
        .catch()
    }

    log(`### ${season} ### DONE ### PLAYER STREAKS ###`)
  }
}
