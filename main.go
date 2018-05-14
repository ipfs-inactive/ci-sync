package main

// TODO use Github Languages feature to figure out what code repositories are made of
// https://api.github.com/repos/libp2p/js-libp2p-half-closed-connection-upgrade/languages
// https://api.github.com/repos/libp2p/js-libp2p/languages

// TODO check and apply Labels as well

import (
	"context"
	"html/template"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/bradfitz/slice"
	"github.com/google/go-github/github"
	"github.com/gregjones/httpcache"
	"github.com/gregjones/httpcache/leveldbcache"
	"github.com/ipfs/ci-sync/checks"
	"golang.org/x/oauth2"
)

type RepositoryStatus struct {
	FullName string
	Links    struct {
		Jenkins                string
		JenkinsMaster          string
		GithubCollaborators    string
		GithubBranchProtection string
	}
	HasJenkins             bool
	IsJenkinsMasterPassing bool
	HasCircle              bool
	HasTravis              bool
	HasAppVeyor            bool
	HasCITeam              bool
	CITeamRightPermissions bool
	HasBranchProtection    bool
	PassesChecks           bool
	LastChecked            time.Time
	LastCheckedPretty      string
}

type TemplateList struct {
	Repositories []RepositoryStatus
}

func GetRateLimitStatus(client *github.Client) string {
	ctx := context.Background()
	rateLimits, _, err := client.RateLimits(ctx)
	if err != nil {
		panic(err)
	}
	core := rateLimits.GetCore()
	limit := strconv.Itoa(core.Limit)
	remaining := strconv.Itoa(core.Remaining)
	reset := core.Reset.UTC().Format(time.RFC3339)
	return "Rate limit status: " + limit + "/" + remaining + " Resets at " + reset
}

func CheckRepo(client *github.Client, repo *github.Repository) RepositoryStatus {
	status := RepositoryStatus{}
	status.FullName = repo.GetFullName()

	// status.Links
	orgName := repo.GetOwner().GetLogin()
	repoName := repo.GetName()

	// TODO replace with blueocean UI, but doesn't work because of casing mismatch Github <> Jenkins
	// status.Links.Jenkins = rootURL + orgName + "%2F" + repoName + "/activity"
	// status.Links.JenkinsMaster = status.Links.Jenkins + "?branch=master"
	status.Links.Jenkins = "https://ci.ipfs.team/job/" + orgName + "/job/" + repoName
	status.Links.JenkinsMaster = "https://ci.ipfs.team/job/" + orgName + "/job/" + repoName + "/job/master/lastBuild"
	status.Links.GithubCollaborators = "https://github.com/" + status.FullName + "/settings/collaboration"
	status.Links.GithubBranchProtection = "https://github.com/" + status.FullName + "/settings/branches"

	status.HasJenkins = checks.GithubRepositoryHasFile(client, repo, "ci/Jenkinsfile")
	status.HasCircle = checks.GithubRepositoryHasFile(client, repo, "circle.yml")
	status.HasTravis = checks.GithubRepositoryHasFile(client, repo, ".travis.yml")
	status.HasAppVeyor = checks.GithubRepositoryHasFile(client, repo, "appveyor.yml")

	if status.HasJenkins {
		status.IsJenkinsMasterPassing = checks.JenkinsMasterPassing(repo)
	}

	hasCITeam, rightPermissions := checks.GithubRepositoryHasCITeam(client, repo)
	status.HasCITeam = hasCITeam
	status.CITeamRightPermissions = rightPermissions

	status.HasBranchProtection = checks.GithubBranchProtection(client, repo)

	status.LastChecked = time.Now()
	status.LastCheckedPretty = status.LastChecked.UTC().Format(time.RFC3339)

	if status.HasJenkins &&
		status.IsJenkinsMasterPassing &&
		!status.HasCircle &&
		!status.HasTravis &&
		!status.HasAppVeyor &&
		status.HasCITeam &&
		status.CITeamRightPermissions {
		status.PassesChecks = true
	} else {
		status.PassesChecks = false
	}
	return status
}

var repositories = []RepositoryStatus{}

func main() {
	// Make sure we have Github token in env
	accessToken := os.Getenv("GITHUB_TOKEN")
	if accessToken == "" {
		panic("Missing environment variable GITHUB_TOKEN")
	}

	httpPort := os.Getenv("PORT")
	if httpPort == "" {
		panic("Missing environment variable PORT")
	}

	// cached client to relive some of the requests to Github
	cache, err := leveldbcache.New("./cache")
	if err != nil {
		panic(err)
	}
	transport := httpcache.NewTransport(cache)
	ctx := context.Background()
	ts := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: accessToken})
	tc := &http.Client{
		Transport: &oauth2.Transport{
			Source: ts,
			Base:   transport,
		},
	}
	client := github.NewClient(tc)

	// HTTP server for index + healthcheck
	http.HandleFunc("/", listHandler)
	http.HandleFunc("/alive", aliveHandler)
	go func() {
		log.Fatal(http.ListenAndServe(":"+httpPort, nil))
	}()

	// Print out rate limit status once per minute
	go func() {
		for {
			log.Println(GetRateLimitStatus(client))
			time.Sleep(time.Second * 60) // TODO make configurable
		}
	}()

	for {
		log.Println("Updating")
		repositories = []RepositoryStatus{}
		var allRepos []*github.Repository
		// Organizations to get repositories from
		orgs := []string{"ipfs", "libp2p", "ipld", "multiformats", "ipfs-shipyard"}
		// orgs := []string{"multiformats"}
		for _, org := range orgs {
			opt := &github.RepositoryListByOrgOptions{
				ListOptions: github.ListOptions{PerPage: 100},
			}
			for {
				log.Println("Fetching repos for " + org)
				repos, resp, err := client.Repositories.ListByOrg(ctx, org, opt)
				if err != nil {
					panic(err)
				}
				for _, repo := range repos {
					// Don't check archived repos
					// Only use javascript repos for now
					if !repo.GetArchived() && strings.HasPrefix(repo.GetName(), "js-") {

						allRepos = append(allRepos, repo)
					}
				}
				// allRepos = append(allRepos, repos...)
				if resp.NextPage == 0 {
					break
				}
				opt.Page = resp.NextPage
			}
		}

		// TODO attempt at concurrency, but need to add buffering so we don't get
		// rate limited by Github while running
		// wg := sync.WaitGroup{}
		// statusCh := make(chan RepositoryStatus)
		// go func() {
		// 	for {
		// 		status := <-statusCh
		// 		numberOfRepos := strconv.Itoa(len(repositories))
		// 		log.Println("Checked " + numberOfRepos + " repositories so far")
		// 		repositories = append(repositories, status)
		// 		wg.Done()
		// 	}
		// }()
		// for _, repo := range allRepos {
		// 	time.Sleep(time.Millisecond * 100)
		// 	wg.Add(1)
		// 	go func(client *github.Client, repo *github.Repository) {
		// 		statusCh <- CheckRepo(client, repo)
		// 	}(client, repo)
		// }
		// wg.Wait()
		numberOfAllRepos := strconv.Itoa(len(allRepos))
		for _, repo := range allRepos {
			log.Println("## Checking " + repo.GetFullName())
			// Actually perform the check
			repositories = append(repositories, CheckRepo(client, repo))
			numberOfRepos := strconv.Itoa(len(repositories))
			log.Println("Checked " + numberOfRepos + "/" + numberOfAllRepos + " repositories so far")
		}
		log.Println("Done checking")

		// Now lets fix repositories if we can
		time.Sleep(time.Hour * 1) // TODO make configurable, currently once per hour
	}
}

func aliveHandler(w http.ResponseWriter, r *http.Request) {
	_, err := w.Write([]byte("alive"))
	if err != nil {
		panic(err)
	}
}

func listHandler(w http.ResponseWriter, r *http.Request) {
	t, _ := template.ParseFiles("./templates/list.html")
	// Sort repos
	slice.Sort(repositories[:], func(i, j int) bool {
		return repositories[i].FullName < repositories[j].FullName
	})
	list := TemplateList{Repositories: repositories}
	err := t.Execute(w, list)
	if err != nil {
		panic(err)
	}
}
