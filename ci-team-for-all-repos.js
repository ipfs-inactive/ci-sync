(async () => {
  const org = 'libp2p'
  const authKey = process.env.GITHUB_TOKEN
  if (!authKey) {
    throw new Error('Environment variable `GITHUB_TOKEN` has to be defined')
  }
  var GitHubApi = require('github')

  var github = new GitHubApi({debug: true})

  github.authenticate({
    type: 'token',
    token: authKey
  })

  let ciTeamID = null
  try {
    const orgTeamsRes = await github.orgs.getTeams({org})
    const orgTeams = orgTeamsRes.data
    for (let team of orgTeams) {
      if (team.slug === 'ci') {
        ciTeamID = team.id
      }
    }
    if (!ciTeamID) {
      throw new Error('Could not find the CI team in this org, please create it')
    }
  } catch (err) {
    console.log(err)
    process.exit(1)
  }

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
  console.log('got all repos', repos.length)
  for (let repo of repos) {
    try {
      const teamsRes = await github.repos.getTeams({
        owner: repo.owner.login,
        repo: repo.name
      })
      const teams = teamsRes.data.map(t => t.slug)
      if (teams.includes('ci')) {
        console.log(repo.full_name + ' already had the ci team')
      } else {
        const res = await github.orgs.addTeamRepo({
          org: repo.owner.login,
          repo: repo.name,
          id: ciTeamID,
          permission: 'push'
        })
        console.log(repo.full_name + ' now has ci team')
      }
    } catch (err) {
      console.log(err)
      process.exit(1)
    }
  }
})()
