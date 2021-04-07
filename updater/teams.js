const loadFHLFile = require('../lib/filesystem/loadFHLFile')

module.exports = {
  run: (db) => {
    let rawHtml = loadFHLFile('TeamScoring')

    const teams = rawHtml.split('<H2>')
    teams.map((html) => {
      const teamnameRegex = html.match(/>([A-Z]{1,20})</)
      let teamname
      if (teamnameRegex) {
        teamname = teamnameRegex[1]
        const teamIdRegex = html.match(`${teamname} Totals +(?<id>[A-Z]{2,3})`)
        if (teamIdRegex) {
          var stmt = db.prepare('INSERT INTO teams VALUES (?, ?)')
          stmt.run(teamname, teamIdRegex.groups.id)
          stmt.finalize()
        }
      }
    })
  }
}
