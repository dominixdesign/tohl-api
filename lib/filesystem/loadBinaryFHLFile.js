const fs = require('fs')
const detectSeason = require('../detectSeason')
const log = require('../../server/helpers/logger')

module.exports = (file) => {
  const season = detectSeason()
  let binary

  try {
    binary = fs.readFileSync(`./import-data/${season}${file}`)
  } catch (err) {
    log(err.message)
    return false
  }
  return binary
}
