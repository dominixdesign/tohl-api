require('dotenv').config()

const teams = require('./teams')
const games = require('./games')
const schedule = require('./games/schedule')
const playerRosterData = require('./player/rosterData')
const playerVitalsData = require('./player/vitalsData')
const playerStats = require('./player/stats')
const streaks = require('./player/streaks')

module.exports = {
  teams,
  playerRosterData,
  playerVitalsData,
  schedule,
  games,
  playerStats,
  streaks
}
