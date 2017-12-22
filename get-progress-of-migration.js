/*
 * This script fetches a list of all repositories and checks if they have a
 * passing jenkins build on master.
 *
 * Checks:
 * - Does the master job exist on jenkins?
 * - Does the automatic-ci-script-update job exist on jenkins?
 */

// Should check in this order:
// - ci/Jenkinsfile exists in master
// - ci/Jenkinsfile exists in automatic-ci-script-update branch
// - PR exists for merging automatic-ci-script-update branch
// - CircleCI exists and it's run for master
// - TravisCI exists and it's run for master
// - Appveyor exists and it's run for master

// Status can be: Missing / Building / Failing / Passing / Aborted
// Should automatically infer javascript/golang/electron projects

var request

async function update () {
  const orgs = [
    'ipfs',
    'ipfs-shipyard',
    'libp2p',
    'multiformats',
    'ipld'
  ]
  const reposToIgnore = [
    'libp2p/js-p2pcat', // wip
    'ipfs/js-ipfs-merkle-dag', // deprecated
    'ipfs/js-docker-base', // no tests
    'ipfs/js.ipfs.io' // no tests
  ]
  const authKey = process.env.GITHUB_TOKEN
  if (!authKey) {
    throw new Error('Environment variable `GITHUB_TOKEN` has to be defined')
  }
  var GitHubApi = require('github')
  request = require('request')
  const fs = require('fs')
  const template = fs.readFileSync('./ci-status.html.template').toString()

  var github = new GitHubApi()

  github.authenticate({
    type: 'token',
    token: authKey
  })

  console.log('Getting all repos')
  const allRepos = []
  for (let org of orgs) {
    let repos = []
    try {
      let res = await github.repos.getForOrg({
        org
      })
      repos = repos.concat(res.data)
      while (github.hasNextPage(res)) {
        res = await github.getNextPage(res)
        repos = repos.concat(res.data)
      }
    } catch (err) {
      console.log(err)
      process.exit(1)
    }
    for (let repo of repos) {
      const isJS = (name) => name.substring(0, 2) === 'js'
      // const isGo = (name) => name.substring(0, 2) === 'go'
      const shouldBeIgnored = (name) => reposToIgnore.includes(name)
      if ((isJS(repo.name) /* || isGo(repo.name) */) && !shouldBeIgnored(org + '/' + repo.name)) {
        const org = repo.owner.login
        const repoName = repo.name
        if (!repo.archived) {
          // TODO need to check for PR for that branch,
          // need to check if branch is on github repository
          // if branch is there, check PR status
          const statusRepo = {
            repo: {name: repoName, org},
            jenkinsMaster: null,
            jenkinsPR: null
          }
          const resMaster = await masterResult(org, repoName)
          statusRepo.jenkinsMaster = resMaster
          if (resMaster !== SUCCESS) {
            const res = await github.pullRequests.getAll({
              owner: org,
              repo: repoName
            })
            let hasCIUpdateBranch = false
            let prNumber = 0
            res.data.forEach((pr) => {
              if (pr.head.ref === 'automatic-ci-script-update') {
                hasCIUpdateBranch = true
                prNumber = pr.number
              }
            })
            if (hasCIUpdateBranch) {
              const resPR = await prResult(org, repoName, prNumber)
              statusRepo.jenkinsPR = resPR
            } else {
              statusRepo.jenkinsPR = MISSING
            }
          } else {
            statusRepo.jenkinsPR = MISSING
          }
          allRepos.push(statusRepo)
        }
      }
    }
  }
  console.log('### end of script')
  let reposHTML = ''
  allRepos.sort((a, b) => {
    const aName = `${a.repo.org}/${a.repo.name}`
    const bName = `${b.repo.org}/${b.repo.name}`
    if (aName < bName) {
      return -1
    }
    if (aName > bName) {
      return 1
    }
    return 0
  }).forEach((r) => {
    const name = `${r.repo.org}/${r.repo.name}`
    let className = CODE_FAILING
    if (r.jenkinsMaster === SUCCESS) {
      className = CODE_PASSING
    }
    if (r.jenkinsMaster === MISSING && r.jenkinsPR === MISSING) {
      className = CODE_MISSING
    }
    if (r.jenkinsMaster === MISSING && r.jenkinsPR === SUCCESS) {
      className = CODE_PASSING_PR
    }
    const repoLink = `<a href="https://github.com/${name}" target="_blank">${name}</a>`
    reposHTML = reposHTML + `<tr class="${className}"><td>${repoLink}</td><td>${r.jenkinsMaster}</td><td>${r.jenkinsPR}</td></tr>`
  })
  const newTemplate = template.replace('{{ROWS}}', reposHTML)
  fs.writeFileSync('./ci-status.html', newTemplate)
  console.log('Updated CI Status')
}

const CODE_FAILING = 'FAILING'// red
const CODE_MISSING = 'MISSING' // orange
const CODE_PASSING_PR = 'PASSING_PR' // yellow
const CODE_PASSING = 'PASSING'// green

const BUILDIN = 'BUILDIN'
const MISSING = 'MISSING'
const SUCCESS = 'SUCCESS'
// const FAILURE = 'FAILURE'
// const ABORTED = 'ABORTED'

function getResult (body) {
  try {
    const result = JSON.parse(body).result
    if (result === null) {
      return BUILDIN
    }
    return result
  } catch (err) {
    return MISSING
  }
}

function masterResult (org, repo) {
  return new Promise((resolve, reject) => {
    const viewUrl = `https://ci.ipfs.team/job/${org}/job/${repo}/job/master`
    const apiUrl = `${viewUrl}/lastBuild/api/json`
    request(apiUrl, (err, res, body) => {
      if (err) return reject(err)
      const result = getResult(body)
      resolve(result)
    })
  })
}

function prResult (org, repo, number) {
  return new Promise((resolve, reject) => {
    const viewUrl = `https://ci.ipfs.team/job/${org}/job/${repo}/view/change-requests/job/PR-${number}`
    const apiUrl = `${viewUrl}/lastBuild/api/json`
    request(apiUrl, (err, res, body) => {
      if (err) return reject(err)
      const result = getResult(body)
      resolve(result)
    })
  })
}

module.exports = update
