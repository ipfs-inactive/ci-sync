package checks

import (
	"strconv"

	"github.com/google/go-github/github"
	"github.com/ipfs/ci-sync/lib"
)

type JenkinsBranchResponse struct {
	Name      string `json:"name"`
	LastBuild struct {
		Number int `json:"number"`
	} `json:"lastBuild"`
}

type JenkinsBuildResponse struct {
	Result          string `json:"result"`
	FullDisplayName string `json:"fullDisplayName"`
}

// Checks if Jenkins master branch is passing
func JenkinsMasterPassing(repo *github.Repository) bool {
	branchRes := JenkinsBranchResponse{}
	org := repo.Owner.GetLogin()
	name := repo.GetName()
	err := lib.GetJSON("https://ci.ipfs.team/job/"+org+"/job/"+name+"/job/master/api/json", &branchRes)
	if err != nil && err.Error() != "404" {
		panic(err)
	}
	if err != nil && err.Error() == "404" {
		return false
	}
	buildRes := JenkinsBuildResponse{}
	buildNum := strconv.Itoa(branchRes.LastBuild.Number)
	err = lib.GetJSON("https://ci.ipfs.team/job/"+org+"/job/"+name+"/job/master/"+buildNum+"/api/json", &buildRes)
	if err != nil {
		panic(err)
	}
	// If it's not passing and has Jenkinsfile, should open a issue about it
	return buildRes.Result == "SUCCESS"
}
