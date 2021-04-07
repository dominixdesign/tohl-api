const fs = require('fs')
const set = require('lodash.set')
const uniqWith = require('lodash.uniqwith')
const isEqual = require('lodash.isequal')
const mkdirp = require('mkdirp')
const getDirName = require('path').dirname
const generatePlayerId = require('../playerId')

const playerfile = 'api/playernames.json'
const playerlastnamesfile = 'api/playerlastnames.json'

module.exports = (nameOrId, changes) => {
  if (nameOrId.includes(' ') && !nameOrId.includes('_')) {
    nameOrId = generatePlayerId(nameOrId)
  }

  let playerJson = null
  let playerLastnameJson = null
  try {
    playerJson = fs.readFileSync(playerfile, 'utf8')
    playerLastnameJson = fs.readFileSync(playerlastnamesfile, 'utf8')
  } catch (err) {
    playerJson = '{}'
    playerLastnameJson = '{}'
  }
  const filePlayer = JSON.parse(playerJson)
  const filePlayerLastname = JSON.parse(playerLastnameJson)

  if (!filePlayer[nameOrId]) {
    filePlayer[nameOrId] = {}
  }
  for (let change in changes) {
    set(filePlayer[nameOrId], change, changes[change])
  }

  const lname_id = changes.lname.toLowerCase()
  if (!filePlayerLastname[lname_id]) {
    filePlayerLastname[lname_id] = []
  }

  filePlayerLastname[lname_id].push(changes)
  filePlayerLastname[lname_id] = uniqWith(filePlayerLastname[lname_id], isEqual)

  // write new data
  mkdirp.sync(getDirName(playerfile))
  fs.writeFileSync(playerfile, JSON.stringify(filePlayer))
  mkdirp.sync(getDirName(playerlastnamesfile))
  fs.writeFileSync(playerlastnamesfile, JSON.stringify(filePlayerLastname))
}
