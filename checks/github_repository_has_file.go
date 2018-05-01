package checks

import (
	"context"

	"github.com/google/go-github/github"
)

// Checks if a file exists in a Github repository
func GithubRepositoryHasFile(client *github.Client, repo *github.Repository, path string) bool {
	ctx := context.Background()
	var opts *github.RepositoryContentGetOptions
	content, _, res, err := client.Repositories.GetContents(
		ctx,
		repo.Owner.GetLogin(),
		repo.GetName(),
		path,
		opts,
	)
	if res.StatusCode == 404 {
		return false
	}
	if err != nil {
		panic(err)
	}
	if content.GetSize() > 0 {
		return true
	}
	panic(repo.GetFullName() + " file finder failed, could not determine if it has " + path)
}
