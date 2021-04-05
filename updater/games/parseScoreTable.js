const xpath = require('xpath')

module.exports = (doc, home, away, tableId) => {
  const valuesAway = xpath.select(
    `//TABLE/TR/TD[${tableId}]/TABLE/TR[2]/TD`,
    doc
  )
  const valuesHome = xpath.select(
    `//TABLE/TR/TD[${tableId}]/TABLE/TR[3]/TD`,
    doc
  )
  return {
    [home]: {
      first: valuesHome[1].firstChild.data,
      second: valuesHome[2].firstChild.data,
      third: valuesHome[3].firstChild.data,
      OT: valuesHome[4].firstChild.data,
      total: valuesHome[5].childNodes[0].firstChild.data
    },
    [away]: {
      first: valuesAway[1].firstChild.data,
      second: valuesAway[2].firstChild.data,
      third: valuesAway[3].firstChild.data,
      OT: valuesAway[4].firstChild.data,
      total: valuesAway[5].childNodes[0].firstChild.data
    }
  }
}
