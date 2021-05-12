require('dotenv').config()

const teams = require('./teams')
const games = require('./games')
const playerRosterData = require('./player/rosterData')
const playerVitalsData = require('./player/vitalsData')

module.exports = {
  teams,
  playerRosterData,
  playerVitalsData,
  games
}
