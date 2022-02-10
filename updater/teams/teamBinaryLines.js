var set = require('lodash.setwith')
var get = require('lodash.get')
const loadBinaryFHLFile = require('../../lib/filesystem/loadBinaryFHLFile')
const { detectSeason, cleaner } = require('../../lib/functions')
const detectGameday = require('../../lib/detectGameday')
const db = require('../../server/helpers/db')
const log = require('../../server/helpers/logger')

module.exports = {
  run: async () => {
    const season = detectSeason()
    log(`### ${season} ### STRT ### TEAM BINARY LINES ###`)

    const linesInserts = []

    let rawBinary = loadBinaryFHLFile('.tms')
    const teamsDone = new Set()

    const players = {}
    await db('playerdata')
      .where({ season })
      .select('teamid', 'playerid', 'simId')
      .then((rows) =>
        rows.map((p) =>
          set(players, `${p.teamid}.${p.simId}`, p.playerid, Object)
        )
      )

    for (let i = 0; i < rawBinary.length; i += 254) {
      const data = rawBinary.slice(i, i + 255)
      const teamid = cleaner(data.slice(61, 64)).toLowerCase()
      const rink = cleaner(data.slice(64, 95))
      const lines = {}

      if (!teamsDone.has(teamid) && rink.length > 2) {
        const l = Object.fromEntries(data.entries())
        set(lines, `even.1.C`, get(players, `${teamid}.${l[174]}`), Object)
        set(lines, `even.2.C`, get(players, `${teamid}.${l[175]}`), Object)
        set(lines, `even.3.C`, get(players, `${teamid}.${l[176]}`), Object)
        set(lines, `even.4.C`, get(players, `${teamid}.${l[177]}`), Object)
        set(lines, `pp1.1.C`, get(players, `${teamid}.${l[178]}`), Object)
        set(lines, `pp1.2.C`, get(players, `${teamid}.${l[179]}`), Object)
        set(lines, `pp2.1.C`, get(players, `${teamid}.${l[180]}`), Object)
        set(lines, `pp2.2.C`, get(players, `${teamid}.${l[181]}`), Object)
        set(lines, `pk1.1.C`, get(players, `${teamid}.${l[182]}`), Object)
        set(lines, `pk1.2.C`, get(players, `${teamid}.${l[183]}`), Object)
        set(lines, `pk2.1.C`, get(players, `${teamid}.${l[184]}`), Object)
        set(lines, `pk2.2.C`, get(players, `${teamid}.${l[185]}`), Object)
        set(lines, `goalie`, get(players, `${teamid}.${l[186]}`), Object)
        set(lines, `even.1.LW`, get(players, `${teamid}.${l[187]}`), Object)
        set(lines, `even.2.LW`, get(players, `${teamid}.${l[188]}`), Object)
        set(lines, `even.3.LW`, get(players, `${teamid}.${l[189]}`), Object)
        set(lines, `even.4.LW`, get(players, `${teamid}.${l[190]}`), Object)
        set(lines, `pp1.1.LW`, get(players, `${teamid}.${l[191]}`), Object)
        set(lines, `pp1.2.LW`, get(players, `${teamid}.${l[192]}`), Object)
        set(lines, `pp2.1.W`, get(players, `${teamid}.${l[193]}`), Object)
        set(lines, `pp2.2.W`, get(players, `${teamid}.${l[194]}`), Object)
        set(lines, `pk1.1.W`, get(players, `${teamid}.${l[195]}`), Object)
        set(lines, `pk1.2.W`, get(players, `${teamid}.${l[196]}`), Object)
        set(lines, `pk2.1.LD`, get(players, `${teamid}.${l[197]}`), Object)
        set(lines, `pk2.2.LD`, get(players, `${teamid}.${l[198]}`), Object)
        set(lines, `extra.1`, get(players, `${teamid}.${l[199]}`), Object)
        set(lines, `even.1.RW`, get(players, `${teamid}.${l[200]}`), Object)
        set(lines, `even.2.RW`, get(players, `${teamid}.${l[201]}`), Object)
        set(lines, `even.3.RW`, get(players, `${teamid}.${l[202]}`), Object)
        set(lines, `even.4.RW`, get(players, `${teamid}.${l[203]}`), Object)
        set(lines, `pp1.1.RW`, get(players, `${teamid}.${l[204]}`), Object)
        set(lines, `pp1.2.RW`, get(players, `${teamid}.${l[205]}`), Object)
        set(lines, `pp2.1.LD`, get(players, `${teamid}.${l[206]}`), Object)
        set(lines, `pp2.2.LD`, get(players, `${teamid}.${l[207]}`), Object)
        set(lines, `pk1.1.LD`, get(players, `${teamid}.${l[208]}`), Object)
        set(lines, `pk1.2.LD`, get(players, `${teamid}.${l[209]}`), Object)
        set(lines, `pk2.1.RD`, get(players, `${teamid}.${l[210]}`), Object)
        set(lines, `pk2.2.RD`, get(players, `${teamid}.${l[211]}`), Object)
        set(lines, `extra.2`, get(players, `${teamid}.${l[212]}`), Object)
        set(lines, `even.1.LD`, get(players, `${teamid}.${l[213]}`), Object)
        set(lines, `even.2.LD`, get(players, `${teamid}.${l[214]}`), Object)
        set(lines, `even.3.LD`, get(players, `${teamid}.${l[215]}`), Object)
        set(lines, `even.4.LD`, get(players, `${teamid}.${l[216]}`), Object)
        set(lines, `pp1.1.LD`, get(players, `${teamid}.${l[217]}`), Object)
        set(lines, `pp1.2.LD`, get(players, `${teamid}.${l[218]}`), Object)
        set(lines, `pp2.1.RD`, get(players, `${teamid}.${l[219]}`), Object)
        set(lines, `pp2.2.RD`, get(players, `${teamid}.${l[220]}`), Object)
        set(lines, `pk1.1.RD`, get(players, `${teamid}.${l[221]}`), Object)
        set(lines, `pk1.2.RD`, get(players, `${teamid}.${l[222]}`), Object)
        set(lines, `even.1.RD`, get(players, `${teamid}.${l[226]}`), Object)
        set(lines, `even.2.RD`, get(players, `${teamid}.${l[227]}`), Object)
        set(lines, `even.3.RD`, get(players, `${teamid}.${l[228]}`), Object)
        set(lines, `even.4.RD`, get(players, `${teamid}.${l[229]}`), Object)
        set(lines, `pp1.1.RD`, get(players, `${teamid}.${l[230]}`), Object)
        set(lines, `pp1.2.RD`, get(players, `${teamid}.${l[231]}`), Object)

        linesInserts.push({
          team: teamid,
          season,
          gameday: detectGameday(),
          lines_json: JSON.stringify(lines)
        })

        teamsDone.add(teamid)
      }
    }

    console.log(linesInserts)
    if (linesInserts.length > 0) {
      await db('line').insert(linesInserts).onConflict().merge().then()
    }
    log(`### ${season} ### DONE ### TEAM BINARY LINES ###`)
  }
}
