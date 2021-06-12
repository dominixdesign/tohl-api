module.exports = (name) => {
  return name.replace(/ /g, '_').replace(/[-.']/g, '').toLowerCase().trim()
}
