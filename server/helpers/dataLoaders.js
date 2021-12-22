const DataLoader = require('dataloader')
const db = require('./db')

module.exports = () => ({
  manager: new DataLoader((ids) =>
    db
      .table('manager')
      .whereIn('id', ids)
      .select()
      .then((rows) => ids.map((id) => rows.find((x) => x.id === id)))
  ),
  team: new DataLoader((ids) =>
    db
      .table('team')
      .whereIn('teamid', ids)
      .select()
      .then((rows) => ids.map((id) => rows.find((x) => x.teamid === id)))
  ),
  player: new DataLoader((ids) =>
    db
      .table('player')
      .whereIn('id', ids)
      .select()
      .then((rows) => ids.map((id) => rows.find((x) => x.id === id)))
  ),
  game: new DataLoader((ids) =>
    db
      .table('game')
      .whereIn(db.raw('CONCAT(`season`,\'-\',`game`)'), ids)
      .select()
      .then((rows) => ids.map((id) => rows.find((x) => `${x.season}-${x.game}` === id)))
  ),
  latestSeason: async (playerId) => {
    const data = await db
      .table('playerdata')
      .select([
        'season',
        db.raw(
          'CONCAT( LEFT(`season`, 6), IF( RIGHT(`season`, 3) = "PLF", "_3", IF( RIGHT(`season`, 3) = "pre", "_1", "_2" ) ) ) AS SeasonSort'
        )
      ])
      .modify((queryBuilder) => {
        if (playerId) {
          queryBuilder.where('playerid', playerId)
        }
      })
      .orderBy('SeasonSort', 'desc')
      .first()
    return data.season
  }
})
