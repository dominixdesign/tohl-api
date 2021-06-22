const loadFHLFile = require('../../lib/filesystem/loadFHLFile')
// const generatePlayerId = require('../../lib/playerId')
const detectSeason = require('../../lib/detectSeason')
// const db = require('../../server/helpers/db')
const log = require('../../server/helpers/logger')

const linesPattern = new RegExp(
  [
    ' [1-4]  ',
    "(?<player1>[A-Za-z \\-'.]{22})",
    "(?<player2>[A-Za-z \\-'.]{22})",
    "(?<player3>[A-Za-z \\-'.]{22})",
    "(?<player4>[A-Za-z \\-'.]{22})*",
    "(?<player5>[A-Za-z \\-'.]*)"
  ].join(''),
  'gm'
)

const lt = ['ES', 'PP', 'PK']

module.exports = {
  run: async () => {
    const season = detectSeason()
    log(`### ${season} ### STRT ### LINES ###`)
    const addLines = []

    let rawHtml = loadFHLFile('Lines')
    const teams = rawHtml.split('<H2>')
    for (const html of teams) {
      let teamnameRegex = html.match(/>([A-Z]{1,20})</)
      if (teamnameRegex) {
        const lineTypes = html.split('<BR><BR>')
        let ltt = 0
        for (const lineType of lineTypes) {
          let row = 1
          const linesMatches = [...lineType.matchAll(linesPattern)] || []
          for (const lineData of linesMatches) {
            console.log(`${lt[ltt]}${row}`, lineData.groups)
            row++
            addLines.push({})
          }
          ltt++
        }
        process.exit()
      }
    }
    log(`### ${season} ### DONE ### LINES ###`)
  }
}
