## This repository has been archived!

This repository has been archived and possibly moved out of the IPFS organization. This may have happened for one or several reasons:

* The code or content is unmaintained, might be broken and should not be used.
* The content is outdated and may mislead the readers.
* The repository evolved into something else, or lived on in a different place.
* The repository or project is not active.

As a result, all issues are frozen. If you wanted to open or continue a discussion, please head over to https://discuss.ipfs.io .

Archival is always reversible! If you think this was a mistake, have specific questions or want a discussion to be moved somewhere else, [please reach out](https://ipfs.io/help) and let us know!

---
   
## ci-sync dashboard
> CI dashboard for Protocol Labs projects

- Jenkins for CI if exists + passing
  - Means removal of any other CIs if they exists
- Checks basic README requirements
- Checks the permissions in the repository
  - should have `ci` team with `write` access
- Syncs labels across repositories
- Syncs settings for Github Branch Protection
- Submits PR for any updates that are required
  - If PR already exists, update that one instead of creating new one
