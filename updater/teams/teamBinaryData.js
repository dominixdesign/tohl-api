const loadBinaryFHLFile = require('../../lib/filesystem/loadBinaryFHLFile')
const { detectSeason, cleaner } = require('../../lib/functions')
const db = require('../../server/helpers/db')
const log = require('../../server/helpers/logger')

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

    // Read conferencens and divisions
    let rawBinaryLGE = loadBinaryFHLFile('.lge')
    const conferences = {
      '00': cleaner(rawBinaryLGE.slice(26, 36)).toLowerCase(),
      '01': cleaner(rawBinaryLGE.slice(123, 133)).toLowerCase()
    }
    const divisions = {
      '0000': cleaner(rawBinaryLGE.slice(39, 49)).toLowerCase(),
      '0001': cleaner(rawBinaryLGE.slice(60, 70)).toLowerCase(),
      '0100': cleaner(rawBinaryLGE.slice(136, 146)).toLowerCase(),
      '0101': cleaner(rawBinaryLGE.slice(157, 167)).toLowerCase()
    }

    let rawBinary = loadBinaryFHLFile('.tms')
    let simId = 0
    const teamsDone = new Set()

    for (let i = 0; i < rawBinary.length; i += 254) {
      const data = rawBinary.slice(i, i + 255)
      const id = cleaner(data.slice(61, 64)).toLowerCase()
      if (!teamsDone.has(id)) {
        const rink = cleaner(data.slice(64, 95))
        const coach = cleaner(data.slice(103, 125))
        const division = data.slice(97, 98).toString('hex')
        const conference = data.slice(98, 99).toString('hex')

        await updateIfNull('rink', rink, id, season)
        await updateIfNull('coach', coach, id, season)

        await db('team')
          .update('simid', simId)
          .update('conference', conferences[conference])
          .update('division', divisions[conference + division])
          .where({
            teamid: id,
            season
          })
        teamsDone.add(id)
      }
      simId++
    }
    log(`### ${season} ### DONE ### TEAM BINARY DATA ###`)
  }
}
