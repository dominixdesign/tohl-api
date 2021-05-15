const DataLoader = require('dataloader')
const db = require('../db')

module.exports = new DataLoader((ids) =>
  db
    .table('manager')
    .whereIn('id', ids)
    .select()
    .then((rows) => ids.map((id) => rows.find((x) => x.id === id)))
)
