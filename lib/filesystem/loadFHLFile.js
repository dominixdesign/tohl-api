const fs = require('fs')
const detectSeason = require('../detectSeason')
const importFolder = require('../importFolder')
const log = require('../../server/helpers/logger')

module.exports = (file) => {
  const season = detectSeason()
  let rawHtml = ''

  try {
    rawHtml = fs.readFileSync(`${importFolder}${season}${file}.html`, 'utf8')
  } catch (err) {
    log(err.message)
    return false
  }
  return rawHtml.replace(/\0/g, '')
}
