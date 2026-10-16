# Releasing

`onsystem` is published to npm and the MCP Registry, and its GitHub Action tagged, from [`.github/workflows/release.yml`](.github/workflows/release.yml), never from a laptop.

## How a release happens

1. A pull request with a changeset merges to `main`. The release workflow opens or updates the release pull request, `chore: release`: `changeset version` moves the version and writes `CHANGELOG.md`, and `scripts/sync-versions.mjs` copies the version into `server.json` and the plugin packages ([CONTRIBUTING.md](CONTRIBUTING.md#releasing) has the list).
2. CI runs on the release pull request as on any other (see [the release GitHub App](#the-release-github-app)). Merge it once its required checks pass, or let it merge by itself (`RELEASE_AUTO_MERGE`, below).
3. The merge runs the release workflow again. With no changesets left, it publishes to npm what npm doesn't have yet, with provenance (npm trusted publishing, no token), and `changesets/action` creates the tag `onsystem@X.Y.Z` and its GitHub release. Then the workflow creates the tag `vX.Y.Z` and its GitHub release, moves `v0` to the release, and publishes `server.json` to the MCP Registry.

On a push to `main`, the workflow runs these jobs, one after the other:

- **Validate the package**, with read permissions: `pnpm typecheck`, `pnpm build`, `pnpm smoke`, `pnpm test` and `pnpm pack-test`, on the commit the next job versions or publishes.
- **Version or publish**, the only job that can write or publish (its `id-token` is for npm trusted publishing and the MCP Registry login): `changesets/action`, which opens the release pull request or runs `pnpm release` (`pnpm build`, then `changeset publish`). It runs no tests, and installs without the pnpm store cache, which the jobs that run the dependencies' code save. Then:
  - with changesets pending, `node scripts/check-published.mjs npm` checks that npm has the version on `main`, or that the version has its tag, since npm can take a few minutes to serve a new version (see [release day](#release-day)). The version is read before `changesets/action`, which switches to the release branch and versions the package there. When the check fails, the steps after it, the merge step included, don't run;
  - with none, `node scripts/check-published.mjs release` gives the version on `main` what it lacks, if npm has it: the tag `onsystem@X.Y.Z` and its GitHub release, with the version's `CHANGELOG.md` entry; the tag `vX.Y.Z` and its GitHub release; and `v0` on the version's commit, while npm's latest is that version. Each goes on the commit the version was published from: the one `onsystem@X.Y.Z` names, the run's own commit when the run published the version, or else the commit npm's provenance for it names. Then `node scripts/check-published.mjs registry` says whether the MCP Registry needs the version (not when it lists it already, nor while npm's latest is another version), and when it does, `mcp-publisher` publishes `server.json`, once its archive matches the sha256 in the workflow (`MCP_PUBLISHER_SHA256`).
- **Run the release from npm and the Action at v0**, with read permissions, after a Version or publish job that found no pending changesets: `npx -y onsystem@X.Y.Z --version` prints the version, `v0`'s `package.json` names npm's latest, and `uses: dgesteves/onsystem@v0` passes the demo's clean page.

Every action is pinned to a commit, with its version in a comment, and Dependabot moves both. The one exception is `dgesteves/onsystem@v0` in the last job, which checks what `@v0` users get.

The changelog entries come from `scripts/changelog.mjs`, which wraps `@changesets/changelog-github`: each entry links its pull request and its commit, and thanks whoever wrote the changeset, except the maintainers named in `.changeset/config.json`. The release pull request and the GitHub release show the same entries.

## The GitHub Action's tags

`uses: dgesteves/onsystem@v0` runs the action at the commit `v0` names, and the action runs the CLI version in its `package.json`, so `v0` follows each release. `vX.Y.Z` never moves, for whoever pins a version. The changesets tag can't serve as either: a `uses:` ref is split on `@` into two parts, so the Marketplace's "Use latest version" on the release `onsystem@0.6.0` gave `uses: dgesteves/onsystem@onsystem@0.6.0`, which doesn't run.

The release `vX.Y.Z` is the one for the Marketplace. Its notes say how to pin it, and link the `onsystem@X.Y.Z` release. Publishing a release to the Marketplace is a box on the release's page, which the workflow can't tick: after each release, edit the `vX.Y.Z` release, tick "Publish this Action to the GitHub Marketplace" (GitHub may ask for 2FA), leave "Set as the latest release" as it is, and update it.

`onsystem@X.Y.Z` is the latest release, and `vX.Y.Z` is created without that mark. If the Marketplace's "Use latest version" still gives the `onsystem@` tag, add a repository variable `RELEASE_ACTION_LATEST` set to `true`: from the next release on, `vX.Y.Z` is created as the latest release instead. For a release already out: `gh release edit vX.Y.Z --latest`.

## The release GitHub App

The pull_request runs of a push made with the workflow's own token wait for approval, and the checks of a CI run the workflow starts itself (`gh workflow run ci.yml`) don't count for the pull request. So before the App, each release pull request needed an empty `chore: run CI` commit before `main` would take it (#49, #70, #85, #109). A push made with the App's token runs CI as any other push does.

The App has two repository permissions, Contents and Pull requests, read and write, and is installed on this repository. Two repository secrets hold it: `RELEASE_APP_ID`, its client ID (or app ID), and `RELEASE_APP_PRIVATE_KEY`, a private key generated on its settings page. When both are set, the workflow uses the App's token, and the version commit, the release pull request, the tags and the GitHub releases are the App's. To rotate the key, generate a new one on the App's page, replace `RELEASE_APP_PRIVATE_KEY`, then delete the old key there.

Without the secrets, the workflow uses its own token, as before. It starts CI on the release branch itself, but GitHub doesn't count those checks for the pull request: on the pull request, approve the CI run that waits for approval, or push an empty commit to `changeset-release/main`.

The ruleset on `main` asks for approval of unattributed changes (`require_extra_approval_for_unattributed_changes`). On the first release pull request the App pushes, check whether it waits for an approval: if it does, approve it, or turn that setting off, before turning on `RELEASE_AUTO_MERGE`.

### Merging the release pull request by itself

To have each release pull request merge by itself once its CI passes, allow auto-merge (Settings, General) and add a repository variable `RELEASE_AUTO_MERGE` set to `true`. A merged changeset then reaches npm as soon as the release pull request's CI passes, so leave it off while releases are timed by hand ([release day](#release-day)). The merge step runs after the check that npm has the version on `main`, and only when that check passes: a release pull request never merges by itself over a version that never reached npm. With the variable set and auto-merge not allowed, the merge step fails, after the release pull request is updated and npm is checked.

## A dry run

Run the workflow by hand on a branch: Actions, Release, Run workflow, or

```sh
gh workflow run release.yml --ref <branch>
```

It publishes, pushes and creates nothing:

- **Validate the package** runs as on a push.
- **Version or publish** doesn't run, and neither does the run from npm and the Action. In their place, **Dry run**, with read permissions only, gets a read-only token from the App when its secrets are set (if that step fails, the App or its secrets need fixing), then:
  - counts the pending changesets as `changeset version` does. With some, it checks that npm has the version on the branch (`check-published.mjs npm`). With none, as right after a release, it says what a run would create or move for the version on the branch, and whether the MCP Registry needs it (`check-published.mjs release --dry-run` and `registry --dry-run`);
  - with pending changesets only, runs `pnpm version-packages` and prints the diff the release pull request would have, changelog entries included;
  - builds and packs the package in the runner, and prints its name, its version and how many files it has;
  - downloads the `mcp-publisher` archive and checks it against `MCP_PUBLISHER_SHA256`, without running it.

A dry run only reads, so it doesn't queue with the releases: one started on `main` neither replaces nor waits for the run of a push to `main`. Dry runs of the same branch run one at a time.

Do one after any change to the release workflow, before the next release.

## Release day

The workflow runs one release at a time. A run that waits behind another is replaced when a newer push to `main` arrives, and that can lose a version: if the run for the release pull request's merge is replaced by the run of a pull request with a changeset, that run only updates the release pull request, and the merged version never reaches npm.

So, before merging the release pull request, wait for any Release run in progress to finish. After merging it, merge nothing else until its Release run has started. If it is replaced anyway, the next run's "The version on main is on npm" step fails and names the version: re-run the replaced run, as below.

pnpm 11 installs only versions published at least a day ago by default (`minimum-release-age`, 1440 minutes in pnpm 11.6.0), and the plugin runs the exact version it was released with ([docs/troubleshooting.md](docs/troubleshooting.md)). Release more than 24 hours before anything points people at the new version.

## When something fails

Re-running a Release run is safe: `changeset publish` publishes only the versions npm doesn't have, the tags and releases step creates only what is missing, and the registry step publishes only a version the MCP Registry doesn't list.

- **The Release run for the release pull request's merge was cancelled**, or a later run's "The version on main is on npm" step fails. Open the run for the merge commit (Actions, Release) and re-run all its jobs. It checks out that commit, publishes its version, then creates its tags and releases, moves `v0` and publishes to the MCP Registry.
- **npm has the version, but a tag, a GitHub release or the `v0` move is missing.** Re-run the run: it publishes nothing, and creates or moves what is missing. The next push to `main` does it too. Either way, the tags go on the commit the version was published from, not on the commit of the run. Without a tag `onsystem@X.Y.Z` or provenance (`https://registry.npmjs.org/-/npm/v1/attestations/onsystem@X.Y.Z`), the step warns and creates nothing: create them by hand at the merge commit of the release pull request, with the version's `CHANGELOG.md` entry as the notes of `onsystem@X.Y.Z`:

  ```sh
  gh release create onsystem@X.Y.Z --target <merge commit> --title onsystem@X.Y.Z --notes-file <entry>
  gh release create vX.Y.Z --target <merge commit> --title vX.Y.Z --latest=false --notes "Release notes: https://github.com/dgesteves/onsystem/releases/tag/onsystem%40X.Y.Z"
  gh api -X PATCH repos/dgesteves/onsystem/git/refs/tags/v0 -f sha=<merge commit> -F force=true
  ```

- **"Does the MCP Registry need this version" fails, saying npm doesn't serve the version yet.** The registry only lists a version npm serves. Once `npm view onsystem@X.Y.Z version` prints it, re-run the job.
- **"Publish to the MCP Registry" fails at `sha256sum`.** The archive isn't the one the checksum was taken from: don't run it. To move to another `mcp-publisher`, change `MCP_PUBLISHER_VERSION` and `MCP_PUBLISHER_SHA256` together, from that release's `registry_<version>_checksums.txt`, and do a dry run.
- **The tags step warns that `vX.Y.Z` names another commit.** Someone created the tag by hand. The workflow never moves a version's tag; check that it names the commit of `onsystem@X.Y.Z`, or delete it so the next run creates it there.
- **Validate the package fails on `main`.** Nothing was versioned or published. Fix `main`, and the next push runs the release again.
- **"Run the release from npm and the Action at v0" fails.** npm doesn't serve the version yet (re-run the job), `v0` doesn't name npm's latest (re-run the Version or publish job), or the Action at `v0` fails the demo's clean page: every `@v0` user gets that, so roll back, below.
- **"Get a token from the release GitHub App" fails.** The App isn't installed on this repository, or a secret is wrong. Fix it and re-run, or delete both secrets to release with the workflow's own token.

## Rolling back a broken release

npm never takes the same version twice, and unpublishing breaks the installs that have it. A broken `onsystem@X.Y.Z` stays on npm, so point everything back at the version before it, then release the fix as a patch changeset, as usual.

1. On npm, logged in as an owner of the package, make the version before it the latest, then deprecate the broken one:

   ```sh
   npm dist-tag add onsystem@<previous> latest
   npm deprecate onsystem@X.Y.Z "<what is broken, and the version to use>"
   ```

   Do this first. The release workflow moves `v0`, and publishes to the MCP Registry, only while npm's latest is the version on `main`, so from now on it leaves both alone.

2. Put `v0` back on the previous release's commit. `vX.Y.Z` stays, for whoever pinned it.

   ```sh
   gh api -X PATCH repos/dgesteves/onsystem/git/refs/tags/v0 -F force=true \
     -f sha="$(gh api repos/dgesteves/onsystem/commits/onsystem%40<previous> --jq .sha)"
   ```

3. If the MCP Registry lists the broken version, deprecate it there, from a machine with [`mcp-publisher`](https://github.com/modelcontextprotocol/registry/releases) logged in (`mcp-publisher login github`):

   ```sh
   mcp-publisher status --status deprecated --message "<what is broken, and the version to use>" io.github.dgesteves/onsystem X.Y.Z
   ```

4. The Claude Code plugin and the packages for other agents pin `onsystem@X.Y.Z` exactly, and `node scripts/sync-versions.mjs --check` keeps them at the version in `package.json`: they move with the next release. Release the fix as a patch changeset. Its release makes the fix npm's latest, and the workflow moves `v0` to it and publishes it to the MCP Registry.
