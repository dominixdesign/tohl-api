const loadFHLFile = require('../lib/filesystem/loadFHLFile')
const detectSeason = require('../lib/detectSeason')
const db = require('../server/helpers/db')

module.exports = {
  run: () => {
    let rawHtml = loadFHLFile('TeamScoring')

    const teams = rawHtml.split('<H2>')
    teams.map((html) => {
      const teamnameRegex = html.match(/>([A-Z]{1,20})</)
      let teamname
      if (teamnameRegex) {
        teamname = teamnameRegex[1]
        const teamIdRegex = html.match(`${teamname} Totals +(?<id>[A-Z]{2,3})`)
        if (teamIdRegex) {
          // insert to db
          db('team')
            .insert({
              teamid: teamIdRegex.groups.id.toLowerCase(),
              season: detectSeason(),
              teamsim: teamname.toLowerCase()
            })
            .onConflict()
            .merge(['teamsim'])
            .then()
            .catch((e) => console.log(e))
        }
      }
    })
  }
}
