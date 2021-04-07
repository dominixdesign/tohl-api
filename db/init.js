module.exports = {
  initDatabase: (db) => {
    db.serialize(function () {
      db.run('CREATE TABLE teams (sim_name TEXT, sim_id TEXT)')
    })
  }
}
