const loadFHLFile = require('../lib/filesystem/loadFHLFile')

module.exports = {
  run: (db) => {
    let rawHtml = loadFHLFile('Rosters')

    const teams = rawHtml.split('<H2>')
    teams.map((html) => {
      let teamnameRegex = html.match(/>([A-Z]{1,20})</)
      if (teamnameRegex) {
        var stmt = db.prepare('INSERT INTO teams VALUES (?)')
        stmt.run(teamnameRegex[1])
        stmt.finalize()
      }
    })
  }
}
