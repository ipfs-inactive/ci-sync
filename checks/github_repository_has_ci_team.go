package checks

import (
	"context"

	"github.com/google/go-github/github"
)

// Checks if a Github repository has a team called `ci` with `push` (`write` in the UI) permissions
func GithubRepositoryHasCITeam(client *github.Client, repo *github.Repository) (bool, bool) {
	ctx := context.Background()
	var opts *github.ListOptions
	teams, _, err := client.Repositories.ListTeams(ctx, repo.GetOwner().GetLogin(), repo.GetName(), opts)
	if err != nil {
		panic(err)
	}
	hasCITeam := false
	rightPermissions := false
	for _, team := range teams {
		if team.GetName() == "ci" {
			hasCITeam = true
			if team.GetPermission() == "push" {
				rightPermissions = true
			}
			break
		}
	}
	return hasCITeam, rightPermissions
}
