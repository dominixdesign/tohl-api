const fs = require('fs')
const detectSeason = require('../detectSeason')
const log = require('../../server/helpers/logger')

module.exports = (file) => {
  const season = detectSeason()
  let rawHtml = ''

  try {
    rawHtml = fs.readFileSync(`./import-data/${season}${file}.html`, 'utf8')
  } catch (err) {
    log(err.message)
    return false
  }
  return rawHtml.replace(/\0/g, '')
}
