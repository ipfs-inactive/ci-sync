package checks

import (
	"context"
	"log"

	"github.com/google/go-github/github"
)

// Checks we want activated for master:
// "Protect this branch" => res or 404
// "Require pull requests reviews before merging" => struct?
// "dismiss stale pull request approvals when new commits are pushed"
// "restrict who can dismiss pull request reviews"
// "require status checks to pass before merging"
// "require branches to be up to date before merging"
// "continous-integration/jenkins/pr-merge needs to be green for merge"
// "require signed commits"
// "include administrators"
// "restricts who can push to this branch"

func GithubBranchProtection(client *github.Client, repo *github.Repository) bool {
	// Skipping most of the protections for now
	// Ref: https://github.com/ipfs/aegir/issues/225

	// ctx := context.Background()
	// protection, res, err := client.Repositories.GetBranchProtection(ctx, repo.GetOwner().GetLogin(), repo.GetName(), "master")
	// if err != nil && res.StatusCode != 404 {
	// 	panic(err)
	// }
	// hasProtection := protection != nil
	// // Attempt to fix protection if none exists
	// // TODO should check individual rules to see if they are correct
	// if !hasProtection {
	// Fix protection
	preq := &github.ProtectionRequest{
		RequiredStatusChecks: &github.RequiredStatusChecks{
			Strict:   true,
			Contexts: []string{},
			// Contexts: []string{"continuous-integration/jenkins/pr-merge"},
		},
		RequiredPullRequestReviews: nil,
		// RequiredPullRequestReviews: &github.PullRequestReviewsEnforcementRequest{
		// 	DismissalRestrictionsRequest: &github.DismissalRestrictionsRequest{
		// 		Users: &[]string{},
		// 		Teams: &[]string{},
		// 	},
		// 	DismissStaleReviews: true,
		// 	// TODO change this once we have code owners (dx wants to own tests for example)
		// 	RequireCodeOwnerReviews: false,
		// },
		EnforceAdmins: false,
		Restrictions: &github.BranchRestrictionsRequest{
			Users: []string{
				// From https://github.com/ipfs/pm/issues/600#issuecomment-385674334
				"diasdavid",
				"VictorBjelkholm",
				"olizilla",
				"hacdias",
				"vmx",
				"kumavis",
				"wanderer",
				"pgte",
				"dignifiedquire",
				"jacobheun",
				"achingbrain",
				"alanshaw",
			},
			Teams: []string{},
		},
	}
	ctx := context.Background()
	_, res, err := client.Repositories.UpdateBranchProtection(ctx, repo.GetOwner().GetLogin(), repo.GetName(), "master", preq)
	if res.StatusCode == 404 {
		log.Println(res.String())
		log.Println("Repo missing master branch???")
		return false
	}
	if err != nil {
		panic(err)
	}
	// Call to check if it's been fixed now (should be!)
	return true
	// return GithubBranchProtection(client, repo)
	// }
	// log.Print("Has protection? ", hasProtection)
	// // Should always return true as if fails, we should fix them
	// return hasProtection
}
