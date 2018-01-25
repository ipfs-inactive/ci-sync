const request = require('request')
const xml2js = require('xml2js')

const transformToReadable = (project) => {
  const toReturn = {}
  const vars = [
    'activity',
    'lastBuildStatus',
    'lastBuildLabel',
    'webUrl',
    'name',
    'lastBuildTime'
  ]
  vars.forEach((v) => {
    toReturn[v] = project['$'][v]
  })
  return toReturn
}

request('https://ci.ipfs.team/cc.xml?recursive', (err, res, body) => {
  if (err) throw err
  xml2js.parseString(body, (err, result) => {
    if (err) throw err
    const results = []
    result.Projects.Project.forEach((p) => {
      results.push(transformToReadable(p))
    })
    console.dir(results)
    results.forEach((r) => {
      if (r.name.indexOf('master') !== -1) {
        console.log(r.webUrl, r.lastBuildStatus)
      }
    })
  })
})
