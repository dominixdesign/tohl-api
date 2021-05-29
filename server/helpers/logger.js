const start = Date.now()
module.exports = (msg) => {
  console.log(Date.now() - start, '|', msg)
}
