const fs = require('fs')
const set = require('lodash.set')
const mkdirp = require('mkdirp')
const getDirName = require('path').dirname

const teamFolder = 'api/t/'

module.exports = (teamId, season, changes) => {
  const teamFile =
    teamFolder + teamId.toLowerCase() + '/roster/' + season + '/index.json'

  let teamJson = null
  try {
    teamJson = fs.readFileSync(teamFile, 'utf8')
  } catch (err) {
    teamJson = '{}'
  }
  const teamData = JSON.parse(teamJson)

  for (let change in changes) {
    set(teamData, change, changes[change])
  }

  // write new data
  mkdirp.sync(getDirName(teamFile))
  fs.writeFileSync(teamFile, JSON.stringify(teamData))
}
