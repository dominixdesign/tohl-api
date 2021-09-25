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
  )
})
