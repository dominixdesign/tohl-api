require('dotenv').config()

const teams = require('./teams/teams')
const teamBinaryData = require('./teams/teamBinaryData')
const games = require('./games')
const schedule = require('./games/schedule')
const playerRosterData = require('./player/rosterData')
const playerVitalsData = require('./player/vitalsData')
const playerBinaryData = require('./player/binaryData')
const playerPayments = require('./player/payments')
const playerStats = require('./player/stats')
const streaks = require('./player/streaks')
const lines = require('./player/lines')

module.exports = {
  teams,
  teamBinaryData,
  schedule,
  playerRosterData,
  playerVitalsData,
  playerBinaryData,
  playerPayments,
  games,
  playerStats,
  streaks,
  lines
}
