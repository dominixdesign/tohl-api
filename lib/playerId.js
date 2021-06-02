module.exports = (name) => {
  return name.replace(' ', '_').replace(/[-.']/g, '').toLowerCase()
}
