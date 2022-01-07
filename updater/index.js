require('dotenv').config()

const teamBinaryData = require('./teams/teamBinaryData')
const games = require('./games')
const schedule = require('./games/schedule')
const playerRosterData = require('./player/rosterData')
const playerVitalsData = require('./player/vitalsData')
const playerBinaryData = require('./player/binaryData')
const playerPayments = require('./player/payments')
const playerStats = require('./player/stats')
const playerStatsTotal = require('./player/total-stats')
const streaks = require('./player/streaks')
const lines = require('./player/lines')

module.exports = {
  teamBinaryData,
  schedule,
  playerRosterData,
  playerVitalsData,
  playerBinaryData,
  playerPayments,
  games,
  playerStats,
  playerStatsTotal,
  streaks,
  lines
}
