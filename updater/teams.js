const loadFHLFile = require('../lib/filesystem/loadFHLFile')
const detectSeason = require('../lib/detectSeason')
const db = require('../server/helpers/db')

module.exports = {
  run: () => {
    const season = detectSeason()
    let rawHtml = loadFHLFile('TeamScoring')
    let rawHtmlStandings = loadFHLFile('Standings')
    const divisionAssignment = rawHtmlStandings.split('<H3>')

    const teamsToDivision = {}
    const teamsToConference = {}

    for (const html of divisionAssignment) {
      const divisionRegex = html.match(
        /(?<divison>[A-Z]+) Division<\/H3>|(?<conference>[A-Z]+) Conference<\/H3>/
      )
      if (divisionRegex) {
        const teamsMatches = [...html.matchAll(/#(?<team>[A-Z]+)/gm)] || []
        for (const { groups } of teamsMatches) {
          if (divisionRegex.groups.divison) {
            teamsToDivision[groups.team.toLowerCase()] =
              divisionRegex.groups.divison.toLowerCase()
          }
          if (divisionRegex.groups.conference) {
            teamsToConference[groups.team.toLowerCase()] =
              divisionRegex.groups.conference.toLowerCase()
          }
        }
      }
    }

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
            conference: teamsToConference[teamname.toLowerCase()],
            division: teamsToDivision[teamname.toLowerCase()],
            teamsim: teamname.toLowerCase()
          })
        }
      }
    }

    if (teamInserts.length > 0) {
      db('team')
        .insert(teamInserts)
        .onConflict()
        .merge(['teamsim', 'conference', 'division'])
        .then()
        .catch((e) => console.log(e))
    }
  }
}
