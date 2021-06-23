module.exports = (name) => {
  return (
    name
      .trim()
      .replace(/ /g, '_')
      // eslint-disable-next-line no-control-regex
      .replace(/[-.'\x00]/g, '')
      .toLowerCase()
  )
}
