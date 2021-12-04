const { detectSeason } = require('../../lib/functions')
const db = require('../../server/helpers/db')
const log = require('../../server/helpers/logger')

module.exports = {
  run: async () => {
    const season = detectSeason()
    log(`### ${season} ### STRT ### PLAYER STATS ###`)

    const playerRef = db.ref('lineup.player')
    const seasonRef = db.ref('lineup.season')
    const teamRef = db.ref('lineup.team')

    const ppg = db('goal')
      .count()
      .groupBy('player', 'scoringteam')
      .where('goalscorer', playerRef)
      .where('season', seasonRef)
      .where('scoringteam', teamRef)
      .where('situation', 'pp')
    const ppa = db('goal')
      .count()
      .groupBy('player', 'scoringteam')
      .where(function () {
        this.where('primaryassist', playerRef).orWhere(
          'secondaryassist',
          playerRef
        )
      })
      .where('season', seasonRef)
      .where('scoringteam', teamRef)
      .where('situation', 'pp')
    const shg = db('goal')
      .count()
      .groupBy('player', 'scoringteam')
      .where('goalscorer', playerRef)
      .where('season', seasonRef)
      .where('scoringteam', teamRef)
      .where('situation', 'sh')
    const sha = db('goal')
      .count()
      .groupBy('player', 'scoringteam')
      .where(function () {
        this.where('primaryassist', playerRef).orWhere(
          'secondaryassist',
          playerRef
        )
      })
      .where('season', seasonRef)
      .where('scoringteam', teamRef)
      .where('situation', 'sh')

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
      .select({ ppg, ppa, shg, sha })
      .sum('minutes as minutes')
      .sum('saves as saves')
      .sum('shutout as shutout')
      .sum('shotsfaced as shotsfaced')
      .sum('goalsagainst as goalsagainst')
      .count('ejected as ejections')
      .count('injured as injuries')
      .groupBy('player', 'team')

    if (allLineupArray.length > 0) {
      await db('playerstats')
        .insert(allLineupArray)
        .onConflict()
        .merge()
        .then()
        .catch()
    }

    log(`### ${season} ### DONE ### PLAYER STATS ###`)
  }
}
