const loadFHLFile = require('../lib/filesystem/loadFHLFile')
const { run } = require('../db/init')

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
          run('INSERT INTO teams VALUES ($teamname, $teamId)', {
            teamname,
            teamId: teamIdRegex.groups.id
          })
        }
      }
    })
  }
}
