(async () => {
  const orgs = [
    'ipfs',
    'ipfs-shipyard',
    'libp2p',
    'multiformats',
    'ipld',
    'gxed'
  ]
  const authKey = process.env.GITHUB_TOKEN
  if (!authKey) {
    throw new Error('Environment variable `GITHUB_TOKEN` has to be defined')
  }
  var GitHubApi = require('github')

  var github = new GitHubApi()

  github.authenticate({
    type: 'token',
    token: authKey
  })
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
    console.log(`Got ${repos.length} for ${org}`)
    for (let repo of repos) {
      try {
        const teamsRes = await github.repos.getTeams({
          owner: repo.owner.login,
          repo: repo.name
        })
      } catch (err) {
        console.log(`https://github.com/${repo.full_name}/settings/collaboration`)
      }
    }
  }
})()
