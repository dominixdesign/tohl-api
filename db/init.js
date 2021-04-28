const sqlite3 = require('better-sqlite3')

let db

const run = (statement, values) => {
  try {
    if (values) {
      db.prepare(statement).run(values)
    } else {
      db.prepare(statement).run()
    }
  } catch (e) {
    if (e.message.substr(0, 25) !== 'UNIQUE constraint failed:') {
      console.log(e.message)
    }
  }
}

const get = (statement, values) => {
  try {
    if (values) {
      db.prepare(statement).get(values)
    } else {
      db.prepare(statement).get()
    }
  } catch (e) {
    console.log(e.message)
  }
}

const all = (statement, values) => {
  let returnValue = []
  try {
    returnValue = db.prepare(statement).all(values)
  } catch (e) {
    console.log(e.message)
  }
  return returnValue
}

const close = () => {
  db.close()
}

const initDatabase = () => {
  db = sqlite3('./db/db.sqlite3')

  run('CREATE TABLE teams (sim_name TEXT, sim_id TEXT)')
  run('CREATE UNIQUE INDEX idx_team ON teams(sim_id, sim_name)')
  run('CREATE TABLE players (player_id TEXT, firstname TEXT, lastname TEXT)')
  run('CREATE UNIQUE INDEX idx_player ON players(player_id)')
}

module.exports = {
  initDatabase,
  run,
  get,
  all,
  close
}
