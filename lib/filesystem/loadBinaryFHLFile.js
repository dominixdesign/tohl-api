const fs = require('fs')
const { importFolder, detectSeason } = require('../functions')
const log = require('../../server/helpers/logger')

module.exports = (file) => {
  const season = detectSeason()
  let binary

  try {
    binary = fs.readFileSync(`${importFolder()}${season}${file}`)
  } catch (err) {
    log(err.message)
    return false
  }
  return binary
}
