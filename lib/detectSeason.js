const { season } = require('./team')

let localSeason

module.exports = () => {
  if (!localSeason) {
    localSeason = season
  }
  return localSeason
}
