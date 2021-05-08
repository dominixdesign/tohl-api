const fs = require('fs')
const mkdirp = require('mkdirp')
const getDirName = require('path').dirname

const tokenFile = 'server/.temp/refreshTokens'

const readFile = () => {
  let refreshTokens = []
  try {
    refreshTokens = JSON.parse(fs.readFileSync(tokenFile, 'utf8'))
  } catch (err) {
    refreshTokens = []
  }
  return refreshTokens
}

const saveFile = (refreshTokens) => {
  mkdirp.sync(getDirName(tokenFile))
  fs.writeFileSync(tokenFile, JSON.stringify(refreshTokens))
}

module.exports = {
  add: (token) => {
    const refreshTokens = readFile()
    refreshTokens.push(token)
    saveFile(refreshTokens)
  },
  remove: (token) => {
    let refreshTokens = readFile()
    refreshTokens = refreshTokens.filter((t) => t !== token)
    saveFile(refreshTokens)
  },
  exists: (token) => {
    const refreshTokens = readFile()
    return refreshTokens.includes(token)
  }
}
