const detectSeason = require('../../lib/detectSeason')
const db = require('../../server/helpers/db')
const log = require('../../server/helpers/logger')

module.exports = {
  run: async () => {
    const season = detectSeason()
    log(`### ${season} ### STRT ### PLAYER STATS ###`)

    // clean playerstats for this season

    const allLineupArray = await db('lineup')
      .where('season', season)
      .select('player', 'team', 'season')
      .count('points as games')
      .sum('goals as goals')
      .sum('assists as assists')
      .sum('points as points')
      .sum('plusminus as plusminus')
      .sum('pim as pim')
      .sum('shots as shots')
      .sum('hits as hits')
      .sum('icetime as icetime')
      .sum('fightswon as fightswon')
      .sum('fightslose as fightslose')
      .sum('fightsdraw as fightsdraw')
      .sum({
        first_stars: db.raw("case when star like 'first' then 1 else 0 end"),
        second_stars: db.raw("case when star like 'second' then 1 else 0 end"),
        third_stars: db.raw("case when star like 'third' then 1 else 0 end")
      })
      .sum('minutes as minutes')
      .sum('saves as saves')
      .sum('shotsfaced as shotsfaced')
      .sum('goalsagainst as goalsagainst')
      .count('ejected as ejections')
      .count('injured as injuries')
      .groupBy('player', 'team')

    await db('playerstats')
      .insert(allLineupArray)
      .onConflict()
      .merge()
      .then()
      .catch()

    log(`### ${season} ### DONE ### PLAYER STATS ###`)
  }
}
