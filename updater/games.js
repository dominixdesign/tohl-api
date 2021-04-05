const xpath = require('xpath'),
  dom = require('xmldom').DOMParser,
  loadFHLFile = require('../lib/filesystem/loadFHLFile'),
  parseScoreTable = require('./games/parseScoreTable')

module.exports = {
  run: () => {
    let gameNumber = 1
    let gameExists = true

    do {
      let rawHtml = loadFHLFile('' + gameNumber)
      if (rawHtml === false) {
        gameExists = false
      } else {
        //cleanup html
        //rawHtml = rawHtml.replace('<FONT SIZE -1>', '')
        const doc = new dom({
          errorHandler: {
            warning: () => {}
          }
        }).parseFromString(rawHtml)

        // parse home and away team
        const [away, home] = xpath
          .select('string(//H3)', doc)
          .toLowerCase()
          .split(' at ')

        // parse shots and goals
        const shots = parseScoreTable(doc, home, away, '1')
        const goals = parseScoreTable(doc, home, away, '3')
        console.log({ shots, goals })

        // next game
        gameNumber = gameNumber + 100
      }
    } while (gameExists)
  }
}
