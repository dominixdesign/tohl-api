module.exports = (team, currentStreak, winner) => {
  const curType = currentStreak.substr(0, 1)
  const curVal = parseInt(currentStreak.substr(1))
  if (team === winner) {
    if (curType === 'W') {
      return `W${curVal + 1}`
    }
    return 'W1'
  }
  if (team !== winner && winner !== null) {
    if (curType === 'N') {
      return `N${curVal + 1}`
    }
    return 'N1'
  }
  if (winner === null) {
    if (curType === 'T') {
      return `T${curVal + 1}`
    }
    return 'T1'
  }
}
