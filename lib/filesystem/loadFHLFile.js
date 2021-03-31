const fs = require('fs')
const detectSeason = require('../detectSeason')

module.exports = (file) => {
  const season = detectSeason()
  let rawHtml = ''

  try {
    rawHtml = fs.readFileSync(`./import-data/${season}${file}.html`, 'utf8')
  } catch (err) {
    console.error(err)
  }
  return rawHtml
}