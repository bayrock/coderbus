const app = require('express')()
const package = require('./package.json')

module.exports = () => {
//   app.use(express.static('public'))

  app.get('/', (request, response) =>
    response.send(`Hi! I'm ${package.name}, nice to meet you :D`))

  const listener = app.listen(process.env.PORT, () =>
    console.log(`Listening on port ${listener.address().port}`))
}