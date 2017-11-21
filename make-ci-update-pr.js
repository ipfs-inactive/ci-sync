(async () => {
  const opn = require('opn')
  const exec = require('execa')
  const repos = require('./repositories.json')

  for (let repo of repos) {
    const owner = repo.split('/')[0]
    const name = repo.split('/')[1]

    await exec.shell(`rm -rf ${name}`)
    await exec.shell(`git clone git@github.com:${owner}/${name}.git`)
    await exec.shell(`cp -r configs//* ${name}`)
    try {
      await exec.shell(`cd ${name} && git diff-files --quiet`)
      await exec.shell(`cd ${name} && test -z "$(git ls-files --others)"`)
      console.log(`No changes for ${repo}`)
    } catch (err) {
      await exec.shell(`cd ${name} && git checkout -b automatic-ci-script-update`)
      await exec.shell(`cd ${name} && git add .`)
      await exec.shell(`cd ${name} && git commit -m "Updating CI files" -m "This commit updates all CI scripts to the latest version"`)
      await exec.shell(`cd ${name} && git push origin automatic-ci-script-update --force`)
      console.log(`Opening PR view for ${repo}`)
      opn(`https://github.com/${owner}/${name}/compare/automatic-ci-script-update?expand=1`)
    }
    await exec.shell(`rm -rf ${name}`)
  }
})()
