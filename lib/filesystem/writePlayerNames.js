const fs = require('fs')
const set = require('lodash.set')
const mkdirp = require('mkdirp')
const getDirName = require('path').dirname
const generatePlayerId = require('../playerId')

const playerfile = 'api/playernames.json'

module.exports = (nameOrId, changes) => {
  if (nameOrId.includes(' ') && !nameOrId.includes('_')) {
    nameOrId = generatePlayerId(nameOrId)
  }

  let playerJson = null
  try {
    playerJson = fs.readFileSync(playerfile, 'utf8')
  } catch (err) {
    playerJson = '{}'
  }
  const filePlayer = JSON.parse(playerJson)

  if (!filePlayer[nameOrId]) {
    filePlayer[nameOrId] = {}
  }
  for (let change in changes) {
    set(filePlayer[nameOrId], change, changes[change])
  }

  // write new data
  mkdirp.sync(getDirName(playerfile))
  fs.writeFileSync(playerfile, JSON.stringify(filePlayer))
}
