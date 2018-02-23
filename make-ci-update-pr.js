console.log('Temporary disabled as its actions are destructive')
process.exit(0)
(async () => {
  const opn = require('opn')
  const exec = require('execa')

  const printAndRun = (cmd) => {
    console.log('=> ' + cmd)
    return exec.shell(cmd, {shell: 'bash'})
  }

  const createPRFor = async function(repo) {
    const owner = repo.split('/')[0]
    const name = repo.split('/')[1]

    await printAndRun(`rm -rf ${name}`)
    await printAndRun(`git clone git@github.com:${owner}/${name}.git`)
    await printAndRun(`shopt -s dotglob && cp -r configs//* ${name}`)
    try {
      await printAndRun(`cd ${name} && git diff-files --quiet`)
      await printAndRun(`cd ${name} && test -z "$(git ls-files --others)"`)
      console.log(`No changes for ${repo}`)
    } catch (err) {
      await printAndRun(`cd ${name} && git checkout -b automatic-ci-script-update`)
      await printAndRun(`cd ${name} && git add .`)
      await printAndRun(`cd ${name} && git commit -m "Updating CI files" -m "This commit updates all CI scripts to the latest version"`)
      await printAndRun(`cd ${name} && git push origin automatic-ci-script-update --force`)
      console.log(`Opening PR view for ${repo}`)
      opn(`https://github.com/${owner}/${name}/compare/automatic-ci-script-update?expand=1`)
    }
    await printAndRun(`rm -rf ${name}`)
  }

  const repo = process.argv[2]
  if (!repo) {
    console.log('Missing repository as first argument, taking repos from ./repositories.json')
    const repos = require('./repositories.json')
    for (let repo of repos) {
      createPRFor(repo)
    }
  } else {
    createPRFor(repo)
  }

})()
