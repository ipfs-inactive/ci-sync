if (!process.env.GITHUB_TOKEN) {
  throw new Error('Environment variable `GITHUB_TOKEN` has to be defined')
}

const httpServer = require('http-server')
const update = require('./get-progress-of-migration.js')

const server = httpServer.createServer()
server.listen(process.env.PORT || 8080)

const updateCIStatus = () => {
  console.log('updating ci status')
  update()
}

setInterval(updateCIStatus, 1000 * 60)
updateCIStatus()
