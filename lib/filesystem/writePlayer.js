const fs = require('fs')
const set = require('lodash.set')
const get = require('lodash.get')
const merge = require('lodash.merge')
const mkdirp = require('mkdirp')
const getDirName = require('path').dirname
const generatePlayerId = require('../playerId')

const playerFolder = 'api/p/'

module.exports = (nameOrId, changes, season = null, detail = 'index') => {
  if (nameOrId.includes(' ') && !nameOrId.includes('_')) {
    nameOrId = generatePlayerId(nameOrId)
  }

  let playerfile = playerFolder + nameOrId + '/' + detail + '.json'
  if (season) {
    playerfile = playerFolder + nameOrId + '/' + season + '/' + detail + '.json'
  }

  let playerJson = null
  try {
    playerJson = fs.readFileSync(playerfile, 'utf8')
  } catch (err) {
    playerJson = '{}'
  }
  const filePlayer = JSON.parse(playerJson)

  for (let change in changes) {
    set(filePlayer, change, merge(get(filePlayer, change), changes[change]))
  }

  // write new data
  mkdirp.sync(getDirName(playerfile))
  fs.writeFileSync(playerfile, JSON.stringify(filePlayer))
}