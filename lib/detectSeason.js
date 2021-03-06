const fs = require('fs')

let season

module.exports = () => {
  if (!season) {
    let rawHtml = ''

    try {
      rawHtml = fs.readFileSync('./import-data/LinkedScoring.html', 'utf8')
    } catch (err) {
      console.error(err)
    }

    let seasonRegex = rawHtml.match(
      /TITLE>(?<season>[A-Z0-9pre]+) Team Scoring<\/TITLE/
    )
    season = seasonRegex.groups.season
  }
  return season
}
