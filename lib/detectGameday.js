const loadFHLFile = require('./filesystem/loadFHLFile')
const detectSeason = require('./detectSeason')

let gameday

module.exports = () => {
  if (!gameday) {
    const season = detectSeason()
    const isPlayoff = season.includes('PLF')
    let rawHtml
    let round = 4

    if (isPlayoff) {
      let rawHtmlPLF = false
      do {
        rawHtmlPLF = loadFHLFile(`-Round${round}-Schedule`)
        if (rawHtmlPLF === false && round > 0) {
          round--
        } else {
          rawHtml = rawHtmlPLF
          rawHtmlPLF = true
        }
      } while (rawHtmlPLF === false)
    } else {
      rawHtml = loadFHLFile('Schedule')
    }

    const matches = [
      ...rawHtml.matchAll(
        /Day (?<gameday>[0-9]*) <BR> *\r\n<A HREF=[0-9A-Z-]+.html> [0-9]+ {3}[A-Z0-9]+ [0-9]+ {2}[A-Z0-9]+ [0-9]+/gm
      )
    ]

    const gameNumber = matches[matches.length - 1].groups.gameday
    gameday = isPlayoff
      ? `${round}${gameNumber.toString().padStart(2, '0')}`
      : gameNumber
  }
  return gameday
}
