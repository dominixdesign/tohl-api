const fs = require('fs')
const loadFHLFile = require('../lib/filesystem/loadFHLFile')
const detectSeason = require('../lib/detectSeason')
const mkdirp = require('mkdirp')
var getDirName = require('path').dirname

const playerFolder = 'api/p/'

const playerRowPattern = new RegExp(
  [
    '(?<number>[0-9 ]{2}) ',
    '(?<name>[A-Za-z ]{22}) ',
    '(?<pos>LW| C| G| D|RW) ',
    '(?<hand>R|L) {2}',
    '(?<cd>OK|[0-9]{2}) ',
    '(?<ij>[A-Z0-9 ]{2})',
    '(?<it> [0-9]{2})',
    '(?<sp> [0-9]{2})',
    '(?<st> [0-9]{2})',
    '(?<en> [0-9]{2})',
    '(?<du> [0-9]{2})',
    '(?<di> [0-9]{2})',
    '(?<sk> [0-9]{2})',
    '(?<pa> [0-9]{2})',
    '(?<pc> [0-9]{2})',
    '(?<df> [0-9]{2})',
    '(?<sc> [0-9]{2})',
    '(?<ex> [0-9]{2})',
    '(?<ld> [0-9]{2})',
    '(?<ov> [0-9]{2})'
  ].join('')
)

const generatePlayerId = (name) => {
  return name.replace(' ', '_').toLowerCase()
}

module.exports = {
  run: () => {
    const season = detectSeason()
    let rawHtml = loadFHLFile('Rosters')

    const teams = rawHtml.split('<H2>')
    teams.map((html) => {
      let teamnameRegex = html.match(/>([A-Z]{1,20})</)
      if (teamnameRegex) {
        let players = html.split('\r\n')
        players.map((playerrow) => {
          let playerData = playerRowPattern.exec(playerrow)
          if (playerData) {
            for (const [key, value] of Object.entries(playerData.groups)) {
              playerData.groups[key] = value.trim()
            }
            const playerfile =
              playerFolder +
              generatePlayerId(playerData.groups.name) +
              '/index.json'

            // load existing data
            let playerJson = null
            try {
              playerJson = fs.readFileSync(playerfile, 'utf8')
            } catch (err) {
              playerJson = '{}'
            }
            const filePlayer = JSON.parse(playerJson)
            const { name, hand, ...seasonData } = playerData.groups

            // merge new data with existing data
            const newData = {
              name,
              hand,
              [season]: seasonData,
              ...filePlayer
            }

            // write new data
            mkdirp.sync(getDirName(playerfile))
            fs.writeFileSync(playerfile, JSON.stringify(newData))
          }
        })
      }
    })

    //console.log(JSON.stringify(playersObject))
  }
}
