## ci-sync
> Sync CI scripts for Jenkins, CircleCI, Travis and AppVeyor

**Currently only for JS projects**

## Usage

* `ci-team-for-all-repos.js` goes through all repos for an org and makes sure there is a team called `ci` with access to all repos
* `make-ci-update-pr.js` clones all repos, adds the ci files from `config/` and creates a PR from that

### `ci-team-for-all-repos.js`

To run `ci-team-for-all-repos.js`, you'll need to define `GITHUB_TOKEN` as a environment variable

```
# Token needs to be a token with read/write access to create branch + PR
GITHUB_TOKEN=XXX node ci-team-for-all-repos.js
```

### `make-ci-update-pr.js`

This script takes all repositories from `repositories.json`, clones each one,
copies over the files from `config/` into the repository, then adds all changes,
creates a branch with changes and pushes it. Once done, it opens the PR view
for submitting the PR (I know! Not entierely automatic, because dealing with
Github Files via the API turned out to be a complete hassle, semi-automatic ftw).

## Internals

`make-ci-update-pr.js` use the following files from the `config/` directory:

- Jenkins: `ci/Jenkinsfile`
- CircleCI: `circle.yml`
- Travis: `.travis.yml`
- AppVeyor: `appveyor.yml`

## License

MIT License

Copyright (c) 2017 Protocol Labs

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
