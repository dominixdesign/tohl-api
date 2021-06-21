require('dotenv').config()

const teams = require('./teams')
const teamBinaryData = require('./teamBinaryData')
const games = require('./games')
const schedule = require('./games/schedule')
const playerRosterData = require('./player/rosterData')
const playerVitalsData = require('./player/vitalsData')
const playerBinaryData = require('./player/binaryData')
const playerStats = require('./player/stats')
const streaks = require('./player/streaks')

module.exports = {
  teams,
  teamBinaryData,
  playerRosterData,
  playerVitalsData,
  playerBinaryData,
  schedule,
  games,
  playerStats,
  streaks
}
