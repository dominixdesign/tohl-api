const loadFHLFile = require('../../lib/filesystem/loadFHLFile')
const { detectSeason } = require('../../lib/functions')
const db = require('../../server/helpers/db')
const log = require('../../server/helpers/logger')

module.exports = {
  run: () => {
    const season = detectSeason()
    log(new Date())
    log(`### ${season} ### STRT ### TEAM BINARY DATA ###`)
    let rawHtml = loadFHLFile('TeamScoring')

    const teamInserts = []
    const teams = rawHtml.split('<H2>')
    for (const html of teams) {
      const teamnameRegex = html.match(/>([A-Z]{1,20})</)
      let teamname
      if (teamnameRegex) {
        teamname = teamnameRegex[1]
        const teamIdRegex = html.match(`${teamname} Totals +(?<id>[A-Z]{2,3})`)
        if (teamIdRegex) {
          const teamid = teamIdRegex.groups.id.toLowerCase()
          teamInserts.push({
            teamid,
            season,
            teamsim: teamname.toLowerCase()
          })
        }
      }
    }

    if (teamInserts.length > 0) {
      db('team')
        .insert(teamInserts)
        .onConflict()
        .merge(['teamsim'])
        .then()
        .catch((e) => console.log(e))
    }
    log(`### ${season} ### DONE ### TEAM BINARY DATA ###`)
  }
}
