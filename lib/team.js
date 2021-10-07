const db = require('../server/helpers/db')
let teams = {}
let season, importFolder
module.exports = {
  init: async (s) => {
    const data = await db('team').select('teamid', 'teamsim')
    importFolder = `./import-data/${s}/`
    season = s

    data.forEach((row) => {
      teams[row.teamsim] = row.teamid
    })
  },
  team: (team) => {
    if (team.length < 4 && team.length > 1) {
      return team.toLowerCase().trim()
    }
    return teams[team.toLowerCase()]
  },
  season: () => season,
  importFolder: () => importFolder
}
