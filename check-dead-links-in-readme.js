(async () => {
  const orgs = [
    'ipfs'
    // 'ipfs-shipyard',
    // 'libp2p',
    // 'multiformats',
    // 'ipld'
  ]
  const authKey = process.env.GITHUB_TOKEN
  if (!authKey) {
    throw new Error('Environment variable `GITHUB_TOKEN` has to be defined')
  }
  var GitHubApi = require('github')
  const execa = require('execa')
  const fs = require('fs')

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

    for (let repo of repos) {
      const readmeURL = `https://github.com/${repo.owner.login}/${repo.name}/blob/master/README.md`
      try {
        const result = await github.repos.getContent({
          owner: repo.owner.login,
          repo: repo.name,
          path: 'README.md'
        })
        const content = Buffer.from(result.data.content, 'base64').toString()
        const filename = `./readmes/${repo.name}.md`
        fs.writeFileSync(filename, content)
        execa('awesome_bot', [
          '--allow-redirect',
          '--allow-dupe',
          '--allow-ssl',
          '--skip-save-results',
          filename
        ]).then((res) => {
          console.log(`## PASS ${readmeURL}`)
          // console.log(res)
        }).catch((err) => {
          console.log(`## FAIL ${readmeURL}`)
          err.stdout.split('\n').forEach((line) => {
            if (line.includes(' 404 ')) {
              console.log(line)
            }
          })
        })
      } catch (err) {
        if (err.code === 404) {
          console.log(`## MISSING README! ${readmeURL}`)
        } else {
          console.log(`## ERROR ${readmeURL}`)
          console.log(err)
        }
      }
    }
  }
})()
