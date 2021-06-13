const start = Date.now()
module.exports = (msg) => {
  console.log((Date.now() - start).toString().padStart(8, ' '), '|', msg)
}
