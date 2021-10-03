const fs = require('fs')
const detectSeason = require('../detectSeason')
const importFolder = require('../importFolder')
const log = require('../../server/helpers/logger')

module.exports = (file) => {
  const season = detectSeason()
  let binary

  try {
    binary = fs.readFileSync(`${importFolder}${season}${file}`)
  } catch (err) {
    log(err.message)
    return false
  }
  return binary
}
