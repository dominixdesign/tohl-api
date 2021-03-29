const fs = require('fs')

module.exports = {
  run: (db) => {
    let rawHtml = ''

    try {
      rawHtml = fs.readFileSync('./import-data/TOHL11Rosters.html', 'utf8')
    } catch (err) {
      console.error(err)
    }

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
