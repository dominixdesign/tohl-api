const db = require('../server/helpers/db')
let teams = {}
module.exports = {
  init: async () => {
    const data = await db('team').select('teamid', 'teamsim')

    data.forEach((row) => {
      teams[row.teamsim] = row.teamid
    })
  },
  team: (team) => {
    if (team.length === 3) {
      return team.toLowerCase()
    }
    return teams[team.toLowerCase()]
  }
}
