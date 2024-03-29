const fs = require('fs')
const { importFolder, detectSeason } = require('../functions')
const log = require('../../server/helpers/logger')

module.exports = (file) => {
  const season = detectSeason()
  let rawHtml = ''

  try {
    rawHtml = fs.readFileSync(`${importFolder()}${season}${file}.html`, 'utf8')
  } catch (err) {
    log(err.message)
    return false
  }
  return rawHtml.replace(/\0/g, '')
}
