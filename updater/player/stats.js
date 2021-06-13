const loadFHLFile = require('../../lib/filesystem/loadFHLFile')
const generatePlayerId = require('../../lib/playerId')
const detectSeason = require('../../lib/detectSeason')
const db = require('../../server/helpers/db')
const log = require('../../server/helpers/logger')

module.exports = {
  run: async () => {
    const season = detectSeason()
    log(`### ${season} ### STRT ### PLAYER STATS ###`)

    const allLineupArray = await db('lineup')
      .where('season', season)
      .select('player')
      .sum('goals as sum_goals')
      .sum('assists as sum_assists')
      .sum('points as sum_points')
      .sum('plusminus as sum_plusminus')
      .sum('pim as sum_pim')
      .sum('shots as sum_shots')
      .sum('hits as sum_hits')
      .sum('icetime as sum_icetime')
      .groupBy('player', 'team')

    for (const statsRow of allLineupArray) {
      console.log(statsRow)
    }

    log(`### ${season} ### DONE ### PLAYER STATS ###`)
  }
}
