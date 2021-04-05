const fs = require('fs')
const detectSeason = require('../detectSeason')

module.exports = (file) => {
  const season = detectSeason()
  let rawHtml = ''

  try {
    rawHtml = fs.readFileSync(`./import-data/${season}${file}.html`, 'utf8')
  } catch (err) {
    console.log(err)
    return false
  }
  return rawHtml.replace(/\0/g, '')
}
