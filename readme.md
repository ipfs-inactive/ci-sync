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
