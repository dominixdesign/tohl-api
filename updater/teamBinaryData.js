const loadBinaryFHLFile = require('../lib/filesystem/loadBinaryFHLFile')
const detectSeason = require('../lib/detectSeason')
const db = require('../server/helpers/db')
const log = require('../server/helpers/logger')

const cleaner = (s) =>
  s
    .toString()
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00]/g, '')
    .trim()

const updateIfNull = async (field, value, teamid, season) =>
  db('team')
    .update(field, value)
    .where(function () {
      this.whereNull(field).orWhere(field, '=', '')
    })
    .where({
      teamid,
      season
    })

module.exports = {
  run: async () => {
    const season = detectSeason()
    log(`### ${season} ### STRT ### TEAM BINARY DATA ###`)

    let rawBinary = loadBinaryFHLFile('.tms')
    let simId = 0

    for (let i = 0; i < rawBinary.length; i += 254) {
      const data = rawBinary.slice(i, i + 255)
      const id = cleaner(data.slice(61, 64)).toLowerCase()
      const rink = cleaner(data.slice(64, 95))
      const coach = cleaner(data.slice(103, 125))

      await updateIfNull('rink', rink, id, season)
      await updateIfNull('coach', coach, id, season)

      await db('team').update('simid', simId).where({
        teamid: id,
        season
      })

      simId++
    }
    log(`### ${season} ### DONE ### TEAM BINARY DATA ###`)
  }
}
