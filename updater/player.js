const fs = require('fs')
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
    let rawHtml = ''

    try {
      rawHtml = fs.readFileSync('./import-data/TOHL11Rosters.html', 'utf8')
    } catch (err) {
      console.error(err)
    }

    let season = rawHtml.match(
      /TITLE>(?<season>[A-Z0-9]+) Team Rosters<\/TITLE/
    )
    console.log(season.groups.season)

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

            // write player files
            const path =
              playerFolder +
              generatePlayerId(playerData.groups.name) +
              '/index.html'

            mkdirp.sync(getDirName(path))
            fs.writeFileSync(path, JSON.stringify(playerData.groups))
          }
        })
      }
    })

    //console.log(JSON.stringify(playersObject))
  }
}
