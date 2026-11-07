# Sources — 2026-11-06-public-presence

> Primary sources fetched 2026-11-06 for this spec. Every fact carries its URL and fetch date. Sections: 1. GitHub docs (Sponsors, FUNDING.yml, issue forms, labels, community profile, private vulnerability reporting, Discussions, social preview, PR templates, orgs/transfer, Contributor Covenant) · 2. Third-party widgets (Buttondown, Kit, Resend, Buy Me a Coffee, Sponsors embeds, shields.io, Starlight) · 3. payloadcms/payload repo setup (+ strapi, sanity contrast) · 4. GitHub workflow status badges.

---

## 1. GitHub Docs Research — VexCMS "Public Presence" Spec

All facts fetched from docs.github.com / cli.github.com / contributor-covenant.org on **2026-11-06** unless noted. URL + fetch date follows each fact.

---

## 1. GitHub Sponsors

### Fees
- **Personal account sponsorships: 0% fee** — "100% of these sponsorships go to the sponsored developer or organization."
- **Organization account sponsorships: up to 6% fee**, split 3% credit-card processing + 3% GitHub service processing fee.
- Organizations can drop the 3% card-processing portion by switching to invoiced billing.
(https://docs.github.com/en/sponsors/getting-started-with-github-sponsors/about-github-sponsors, 2026-11-06)

### Eligibility / regions
- Any individual who contributes to an open source project (code, docs, triage, design, mentorship, etc.) and **lives in a supported region** is eligible as a sponsored developer.
- Any organization that contributes to OSS and **legally operates in a supported region** is eligible as a sponsored organization.
- Non-supported regions can join a waitlist.
- ~95 supported regions listed (e.g., US, UK, Canada, most EU, Japan, India, Brazil, South Africa, etc.) — see full list at source URL.
- Anyone, from any region, can sponsor (give money); only receiving funds requires a supported region.
(https://docs.github.com/en/sponsors/getting-started-with-github-sponsors/about-github-sponsors, 2026-11-06)

### Sponsored developer vs sponsored organization — can orgs be sponsored?
- Yes — "You can sponsor anyone with a sponsored developer profile **or sponsored organization profile** on behalf of your personal account or an organization."
- Org setup differs: requires an **invitation** to join the waitlist process, choice of payout via bank account or **fiscal host**, submission of **Form W-8BEN-E** (vs individual tax forms for personal accounts), and org-level 2FA requirement before approval.
- Org profile has a "Meet the team" section (up to 6 highlighted org members, each with an optional description) not present on individual profiles.
(https://docs.github.com/en/sponsors/receiving-sponsorships-through-github-sponsors/setting-up-github-sponsors-for-your-organization, 2026-11-06)

### Joining process (personal) — approval / lead time
- Submitting application requires: profile details, tiers (optional), bank/fiscal-host info, tax forms, **2FA enabled**, then click **Request approval**.
- "It may take **a few days** for GitHub to review your application." After approval, profile goes live automatically on github.com/sponsors.
(Same org-setup page structure applies to personal accounts per cross-reference; org page states identical "few days" review language, 2026-11-06)

### Payout mechanism
- **Stripe Connect account** is used to receive payouts (bank account in supported region), OR a **fiscal host** (chosen only at initial signup; switching later requires contacting GitHub Support).
(https://docs.github.com/en/sponsors/receiving-sponsorships-through-github-sponsors/setting-up-github-sponsors-for-your-organization, 2026-11-06)

### Tiers
- Up to **10 one-time tiers** and **10 monthly tiers** may be published; publishing tiers is optional.
- Each tier: custom US-dollar price, **maximum price US$12,000/month**.
- Once published, a tier's **price cannot be edited** — must retire and create a new tier; existing sponsors stay on the retired tier until they cancel/change.
- Tiers support a **welcome message** ("Display welcome message" checkbox + text), shown after payment and in the welcome email.
- A tier can grant sponsors automatic access to a **private repository** (repo must be private and **owned by an organization**; admin access required to add it). GitHub auto-sends repo invitations to new sponsors and removes access on cancellation. Only personal accounts (not orgs) can be invited this way.
- Repo-transfer effects on tier-granted access: org→org transfer keeps existing sponsors but stops adding new ones (new owner can remove); personal→org transfer (if same owner has admin) keeps + continues adding; any→personal transfer removes all sponsors and stops new additions.
(https://docs.github.com/en/sponsors/receiving-sponsorships-through-github-sponsors/managing-your-sponsorship-tiers, 2026-11-06)

### Profile featured work / team
- "Featured work" section: edit → select **up to 6 repositories** to showcase.
- Org profile "Meet the team": select **up to 6 org members** to highlight, each with optional description.
- Optional checkbox: "Opt-in to get featured on github.com/sponsors."
(https://docs.github.com/en/sponsors/receiving-sponsorships-through-github-sponsors/setting-up-github-sponsors-for-your-organization, 2026-11-06)

### Sponsorship goals
- The dedicated "Setting sponsorship goals" docs page returned **HTTP 404** when fetched (may have been merged/renamed/removed from current docs). Not independently verifiable from a primary GitHub Docs source at this time. **[INFERENCE/gap]** — could not confirm goal types (number-of-sponsors vs monthly-amount) from a primary source in this session; recommend checking github.com/sponsors UI directly or a blog post if this detail is required for the spec.
(attempted: https://docs.github.com/en/sponsors/receiving-sponsorships-through-github-sponsors/setting-sponsorship-goals — 404, 2026-11-06)

### Sponsor button
- Configured via `.github/FUNDING.yml` on the default branch (see §2). Anyone with admin permissions can enable it via repo Settings → General → Features → Sponsorships → "Set up sponsor button" / "Override funding links."
(https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/displaying-a-sponsor-button-in-your-repository, 2026-11-06)

---

## 2. FUNDING.yml

- **Location:** `.github/FUNDING.yml` in the repository, on the **default branch**. An org-wide default can be set via a `.github` repository owned by the org/personal account ("Creating a default community health file").
(https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/displaying-a-sponsor-button-in-your-repository, 2026-11-06)

### Full key list (verbatim syntax)

| Platform | Syntax |
|---|---|
| LFX Mentorship (formerly CommunityBridge) | `community_bridge: PROJECT-NAME` |
| GitHub Sponsors | `github: USERNAME` or `github: [USERNAME, USERNAME, USERNAME, USERNAME]` |
| IssueHunt | `issuehunt: USERNAME` |
| Ko-fi | `ko_fi: USERNAME` |
| Liberapay | `liberapay: USERNAME` |
| Open Collective | `open_collective: USERNAME` |
| Patreon | `patreon: USERNAME` |
| Tidelift | `tidelift: PLATFORM-NAME/PACKAGE-NAME` |
| Polar | `polar: USERNAME` |
| Buy Me a Coffee | `buy_me_a_coffee: USERNAME` |
| thanks.dev | `thanks_dev: u/gh/USERNAME` |
| Custom URL | `custom: LINK1` or `custom: [LINK1, LINK2, LINK3, LINK4]` |

### Limits
- `github:` — **up to 4 usernames** (one org + up to 4 sponsored developers per the doc's prose; array syntax shown with 4 example usernames max implied — "You can add one organization and up to four sponsored developers in GitHub Sponsors").
- `custom:` — **up to 4 custom URLs**.
- All other platforms — **one username/package/project name per platform**.
- Each platform on its own line.

### Tidelift platform names
JavaScript→`npm`, Python→`pypi`, Ruby→`rubygems`, Java→`maven`, PHP→`packagist`, C#→`nuget`.

### Example
```yaml
github: [octocat, surftocat]
patreon: octocat
tidelift: npm/octo-package
custom: ["https://www.paypal.me/octocat", octocat.com]
```
Note: a custom URL containing `:` inside an array must be quoted.

(https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/displaying-a-sponsor-button-in-your-repository, 2026-11-06)

---

## 3. Issue forms / templates

### Issue form top-level YAML keys
File location: `.github/ISSUE_TEMPLATE/*.yml`.

| Key | Required | Type | Notes |
|---|---|---|---|
| `name` | Required | String | Must be unique across all templates (incl. Markdown ones); **must be more than 3 characters** or the template won't display. |
| `description` | Required | String | Shown in template chooser. |
| `body` | Required | Array | The form elements. |
| `assignees` | Optional | Array or comma-delimited string | Auto-assigned. |
| `labels` | Optional | Array or comma-delimited string | Auto-applied; label must already exist in repo or it's silently skipped. |
| `title` | Optional | String | Pre-populated issue title. |
| `type` | Optional | String | Issue type auto-applied; **issue types are defined at the organization level** (see Issue Types section below). |
| `projects` | Optional | Array or comma-delimited string | Format `PROJECT-OWNER/PROJECT-NUMBER`; submitter needs write access to the project (or enable project auto-add workflow). |

(https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms, 2026-11-06)

### Body element types and attributes (GitHub's form schema)
Types: `markdown`, `textarea`, `input`, `dropdown`, `checkboxes`, `upload`.

- **`markdown`**: attribute `value` (required, String, Markdown-formatted display text, not submitted with the issue). No `id`, no validations.
- **`textarea`**: attributes `label` (required), `description`, `placeholder`, `value`, `render` (formats submission into a code block using a Linguist-known language; disables file-attachment/Markdown editing expansion when set). Validations: `required` (Boolean, default false, "Only for public repositories"), `min_length` (Integer).
- **`input`**: attributes `label` (required), `description`, `placeholder`, `value`. Validations: `required`, `min_length`.
- **`dropdown`**: attributes `label` (required), `description`, `multiple` (Boolean, default false — allows multi-select), `options` (required String array, non-empty, all distinct), `default` (Integer index into `options`; cannot combine a default with "None"/"n/a" options). Validations: `required`.
- **`checkboxes`**: attribute `label` (required); each option has `label` + optional `required: true` (per-checkbox required, e.g., "I agree to ... Code of Conduct").
- Each top-level element supports `id` (optional except required effectively for non-markdown types if referenced; alphanumeric, `-`, `_`; unique; used as canonical identifier for URL query-param prefills), `attributes` (required Map), `validations` (optional Map).

(https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-githubs-form-schema, 2026-11-06)

### Full example (from docs)
```yaml
name: Bug Report
description: File a bug report.
title: "[Bug]: "
labels: ["bug", "triage"]
projects: ["octo-org/1", "octo-org/44"]
assignees:
  - octocat
type: bug
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to fill out this bug report!
  - type: input
    id: contact
    attributes:
      label: Contact Details
      description: How can we get in touch with you if we need more info?
      placeholder: ex. email@example.com
    validations:
      required: false
  - type: textarea
    id: what-happened
    attributes:
      label: What happened?
      description: Also tell us, what did you expect to happen?
      placeholder: Tell us what you see!
      value: "A bug happened!"
    validations:
      required: true
  - type: dropdown
    id: version
    attributes:
      label: Version
      description: What version of our software are you running?
      options:
        - 1.0.2 (Default)
        - 1.0.3 (Edge)
      default: 0
    validations:
      required: true
  - type: dropdown
    id: browsers
    attributes:
      label: What browsers are you seeing the problem on?
      multiple: true
      options:
        - Firefox
        - Chrome
        - Safari
        - Microsoft Edge
  - type: textarea
    id: logs
    attributes:
      label: Relevant log output
      description: ...
      render: shell
  - type: checkboxes
    id: terms
    attributes:
      label: Code of Conduct
      description: ...
      options:
        - label: I agree to follow this project's Code of Conduct
          required: true
  - type: upload
    id: screenshots
    attributes:
      label: Upload screenshots
    validations:
      required: false
```
(https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms, 2026-11-06)

Issue forms "are currently in public preview and subject to change" per the docs note.

### `config.yml` template chooser
Location: `.github/ISSUE_TEMPLATE/config.yml`.

Keys:
- `blank_issues_enabled` (Boolean) — if `false`, Write/Maintain/Admin roles still see "Blank issue" labeled "Maintainers only"; Read/Triage roles see only configured templates.
- `contact_links` (array of objects): `name`, `url`, `about` — directs users to external resources instead of/alongside issue templates.

Example:
```yaml
blank_issues_enabled: false
contact_links:
  - name: GitHub Community Support
    url: https://github.com/orgs/community/discussions
    about: Please ask and answer questions here.
  - name: GitHub Security Bug Bounty
    url: https://bounty.github.com/
    about: Please report security vulnerabilities here.
```
Changing template filename order (e.g., `1-bug.yml`, `2-feature.yml`) controls chooser order; YAML files sort before Markdown files alphanumerically; use zero-padding (`01-`, `02-`, `11-`) past 9 templates.
(https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository, 2026-11-06)

### Issue types: personal vs org repos
- Issue types ("task", "bug", "feature" defaults, up to 25 custom) are **managed and defined at the organization level only** — doc title is explicitly "Managing issue types **in an organization**"; created via Org Settings → Planning → Issue types.
- Can be edited, disabled (soft-remove, reversible), or deleted (permanent).
- The `type:` key in an issue-form template references an org-level issue type — **not available for personal-account (non-org) repositories**, since issue types are an org-scoped concept.
(https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/managing-issue-types-in-an-organization, 2026-11-06)

### Discussion category forms (`.github/DISCUSSION_TEMPLATE/<category-slug>.yml`)
- Use the **same GitHub form schema** as issue forms (`markdown`, `textarea`, `input`, `dropdown`, `checkboxes` — "written in YAML using the GitHub form schema").
- File path: `/.github/DISCUSSION_TEMPLATE/FORM-NAME.yml` where `FORM-NAME` **must correspond to the category's slug** (e.g., Announcements category → `.github/DISCUSSION_TEMPLATE/announcements.yml`).
- **Not supported for Polls** category.
- Org-level default discussion forms can be set via the org's `.github` repo.
- Requires write access to the repository to create.
(https://docs.github.com/en/discussions/managing-discussions-for-your-community/creating-discussion-category-forms, 2026-11-06)

---

## 4. Labels

### Default label set (every new repository)

| Label | Description |
|---|---|
| `accessibility` | Indicates a barrier affecting people with disabilities |
| `bug` | Indicates an unexpected problem or unintended behavior |
| `documentation` | Indicates a need for improvements or additions to documentation |
| `duplicate` | Indicates similar issues, pull requests, or discussions |
| `enhancement` | Indicates new feature requests |
| `good first issue` | Indicates a good issue for first-time contributors |
| `help wanted` | Indicates that a maintainer wants help on an issue or pull request |
| `invalid` | Indicates that an issue, pull request, or discussion is no longer relevant |
| `question` | Indicates that an issue, pull request, or discussion needs more information |
| `wontfix` | Indicates that work won't continue on an issue, pull request, or discussion |

- Labels are per-repository (no cross-repo effect from edits/deletions).
- `good first issue`-labeled issues populate the repo's `/contribute` page.
- Org owners can customize org-wide default labels for new repos.
(https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/managing-labels, 2026-11-06)

### Managing labels (UI)
- Create/Edit: anyone with **write access**; set Label name, Description, hex color (random-color button available).
- Apply: anyone with **triage access**.
- Delete: anyone with **write access** (removes label from all issues/PRs).
(same URL, 2026-11-06)

### `gh label` CLI (cli.github.com/manual)
Base: `gh label` with global flag `-R/--repo <[HOST/]OWNER/REPO>`.

**`gh label create <name> [flags]`**
- `-c, --color <string>` — color (6-char hex; random if omitted)
- `-d, --description <string>` — description
- `-f, --force` — update color/description if label already exists (acts as upsert)
- Example: `gh label create bug --description "Something isn't working" --color E99695`

**`gh label edit <name> [flags]`**
- `-c, --color <string>`
- `-d, --description <string>`
- `-n, --name <string>` — rename
- Example: `gh label edit bug --color FF0000`

**`gh label clone <source-repository> [flags]`**
- Copies **all** labels from source repo to destination (default: current repo); existing labels in destination are skipped unless `-f/--force` (overwrites).
- Example: `gh label clone cli/cli --force`

**`gh label list [flags]`**
- `-q, --jq <expression>`, `--json <fields>`, `-L, --limit <int>` (default 30), `--order <string>` (default "asc"), `-S, --search <string>`, `--sort <string>` (default "created"; or "name"), `-t, --template <string>`, `-w, --web`
- Alias: `gh label ls`
- JSON fields: `color`, `createdAt`, `description`, `id`, `isDefault`, `name`, `updatedAt`, `url`

**`gh label delete`** exists per the top-level `gh label` command list but its flag page wasn't separately fetched in this session (listed as an available subcommand).

Color format: **6-character hex value** (no `#` prefix needed in CLI input per examples, e.g., `E99695`).
Name/description length limits: not explicitly stated numerically in the fetched docs (no character-count limit documented on these pages).

(https://cli.github.com/manual/gh_label, https://cli.github.com/manual/gh_label_create, https://cli.github.com/manual/gh_label_edit, https://cli.github.com/manual/gh_label_clone, https://cli.github.com/manual/gh_label_list — all 2026-11-06)

No official/documented label-sync GitHub Action was found in the fetched docs; use `gh label` CLI commands as the documented mechanism.

---

## 5. Community profile

### What the checklist counts
Per "About community profiles for public repositories": checks for recommended community health files — **README, CODE_OF_CONDUCT, LICENSE, CONTRIBUTING**, in a supported location, plus **issue templates** (must be in `.github/ISSUE_TEMPLATE` with valid `name:`+`about:` for `.md` templates or `name:`+`description:` for `.yml` issue forms) and PR templates.
(https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/about-community-profiles-for-public-repositories, 2026-11-06)

### REST endpoint: `GET /repos/{owner}/{repo}/community/profile`
- Repository **cannot be a fork**.
- Response fields:
  - `health_percentage` (integer, required) — "percentage of how many of the recommended community health files are present"
  - `description` (string or null)
  - `documentation` (string or null)
  - `files` (object):
    - `code_of_conduct` (null | Code Of Conduct Simple: `url`, `key`, `name`, `html_url`)
    - `code_of_conduct_file` (null | Community Health File: `url`, `html_url`)
    - `license` (null | License Simple: `key`, `name`, `url`, `spdx_id`, `node_id`, `html_url`)
    - `contributing` (null | Community Health File)
    - `readme` (null | Community Health File)
    - `issue_template` (null | Community Health File)
    - `pull_request_template` (null | Community Health File)
  - `updated_at` (string or null, date-time)
  - `content_reports_enabled` (boolean) — **only returned for organization-owned repositories**
(https://docs.github.com/en/rest/metrics/community?apiVersion=2022-11-28, 2026-11-06)

### Locations for community health files
- Root, `docs/`, or `.github/` directories are the supported locations (per general GitHub Docs convention referenced across the issue-template, PR-template, and security-policy pages fetched — e.g., PR template can live at `pull_request_template.md` (root), `docs/pull_request_template.md`, or `.github/pull_request_template.md`).
- Org-level defaults: create a `.github` repository owned by the org (or personal account); files placed there (README, CONTRIBUTING, CODE_OF_CONDUCT, ISSUE_TEMPLATE, PULL_REQUEST_TEMPLATE, FUNDING.yml, etc.) apply as defaults to any repo in that org/account lacking its own copy. (Referenced via "Creating a default community health file" cross-links on multiple pages: FUNDING.yml docs, issue-template docs, PR-template docs, SECURITY.md docs.)
(https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/displaying-a-sponsor-button-in-your-repository; https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository, 2026-11-06)

---

## 6. Private vulnerability reporting

### Enabling via Settings (repo level)
1. Repo → **Settings** → **Security and quality** sidebar section → **Advanced Security**.
2. Under "Advanced Security", next to "Private vulnerability reporting", click **Enable** (or **Disable**).
- Once enabled, security researchers see a **"Report a vulnerability"** button on the repo's **Advisories** page.
(https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/configure-for-a-repository, 2026-11-06)

### What reporters see / submit
- Default form requires: **summary, details, proof of concept, impact statement**.
- Can be customized via `.github/VULNERABILITY_REPORT.yml` (or `.yaml`) in the repo, or a default in the owner's `.github` repo (repo-specific form takes precedence). Uses the **same YAML form schema** as issue forms, supporting `checkboxes`, `dropdown`, `input`, `markdown`, `textarea`; supports `min_length` on `input`/`textarea`. If GitHub can't parse/validate the custom form, the default form is shown instead.
- Reporters can also submit via **REST API** using Markdown `description` (must match custom-form required sections if one is defined; the default web form isn't enforced for API submissions).
- Optional: require reporters to assign a **CWE** (Common Weakness Enumeration) — repo setting under Advanced Security → Private vulnerability reporting → Settings → "Require a CWE assignment." Applies to web UI and REST API submissions, not maintainer-created advisories/edits.
- Rate limits exist per-repo and per-user per 24h period; trusted reporters can be exempted.
(https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/configure-for-a-repository, 2026-11-06)

### REST API
- The REST docs page for repos (`/en/rest/repos/repos`) includes an endpoint referenced as "Enable private vulnerability reporting for a repository" (anchor confirmed to exist on the page, titled **REST API endpoints for repositories**), consistent with `PUT /repos/{owner}/{repo}/private-vulnerability-reporting` and a corresponding `DELETE` to disable, per standard GitHub REST naming conventions for this resource — the specific request/response schema for that sub-section was not captured in the fetched content window (page is large; only the "List/Create organization repositories" portion rendered in the read window). **[gap — exact JSON schema of the PUT/DELETE private-vulnerability-reporting endpoints not directly captured in this session; endpoint existence and naming confirmed via docs navigation/anchor, full response body not verified.]**
(https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#enable-private-vulnerability-reporting-for-a-repository, 2026-11-06)

### Security advisories workflow
- Create a **draft security advisory** → privately discuss impact → collaborate on fix in a **temporary private fork** → **publish** to disclose to the community.
- Publishing: advisory data and accepted credits become visible to **anyone**; **collaborators** see the full conversation history. URL doesn't change after publication.
- **CVE assignment**: GitHub is a CVE Numbering Authority (CNA); can request a CVE ID (GitHub reviews within ~72 hours); requesting doesn't make the advisory public; CVE details publish when advisory is published.
- Published advisories (for dependency-graph-supported ecosystems) propagate to github.com/advisories and may trigger **Dependabot alerts** (GitHub reviews within up to 72 hours); npm advisories also sync to npmjs.com/advisories.
- Recommendation: add a **fix version** before publishing, or Dependabot alerts users with no safe upgrade target.
(https://docs.github.com/en/code-security/concepts/vulnerability-reporting-and-management/repository-security-advisories, 2026-11-06)

### SECURITY.md
- Created via repo → **Security and quality** tab → **Security policy** → **Start setup**, which scaffolds `SECURITY.md`.
- Recommended content per docs: "information about supported versions of your project and how to report a vulnerability."
(https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/add-security-policy, 2026-11-06)

---

## 7. Discussions

### Enabling
- **Repository**: Owners/write-access users → Settings → Features → "Set up discussions" → configure a welcome post → "Start discussion."
- **Organization**: Org owners → Org Settings → "Code, planning, and automation" → Discussions → "Enable discussions for this organization" → pick a **source repository** (existing or new) to host org discussions. Changing the source repo later does **not** migrate existing discussions. Org-discussion permissions mirror permissions on the source repo.
(https://docs.github.com/en/discussions/quickstart, 2026-11-06)

### Default categories

| Category | Purpose | Format |
|---|---|---|
| 📣 Announcements | Updates/news from maintainers | Announcement |
| #️⃣ General | Anything relevant to the project | Open-ended discussion |
| 💡 Ideas | Ideas to change/improve the project | Open-ended discussion |
| 🗳 Polls | Multi-option polls | Polls |
| 🙏 Q&A | Questions with answer marking | Question and Answer |
| 🙌 Show and tell | Creations/experiments/tests | Open-ended discussion |

(https://docs.github.com/en/discussions/managing-discussions-for-your-community/managing-categories-for-discussions, 2026-11-06)

### Category formats
- **Open-ended discussion**, **Question and Answer** (Q&A — answer-marking), **Announcement** (only maintain/admin can start new discussions; anyone can comment/reply), and **Polls** (separate format listed among defaults; poll creation flow is distinct: "New discussion" → Polls category → question + ≥2 options, "Add an option" button for more).
- Each category has a **unique name + emoji** pairing plus optional description.
- Up to **25 categories** per repo/org.
- Categories can be nested into **sections** (a category belongs to at most one section).
- All discussions can be transferred to another repo **except Announcements**.
(https://docs.github.com/en/discussions/managing-discussions-for-your-community/managing-categories-for-discussions; https://docs.github.com/en/discussions/quickstart, 2026-11-06)

### Creating categories — UI only or API?
- Documented workflow is **UI-only**: Discussions tab → pencil icon next to "Categories" → "New category" → set emoji/title/description/format → optional section → Create. No REST/GraphQL mutation for category creation was referenced on this docs page. **[not independently confirmed via GraphQL docs — UI path is the only one documented on the fetched page]**
(https://docs.github.com/en/discussions/managing-discussions-for-your-community/managing-categories-for-discussions, 2026-11-06)

### Pinned discussions
- Referenced as a moderation feature ("Managing discussions") — maintainers with write permission can pin discussions (e.g., a welcome post) to surface them; pinning/locking "helps people know that a post is meant as an announcement." Full pin-limit details not captured in this session's fetch (cross-referenced, not directly read).
(https://docs.github.com/en/discussions/quickstart, 2026-11-06)

### `contact_links` → Discussions
- `config.yml` `contact_links` entries can point to a Discussions URL, e.g.:
```yaml
contact_links:
  - name: GitHub Community Support
    url: https://github.com/orgs/community/discussions
    about: Please ask and answer questions here.
```
(https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository, 2026-11-06)

---

## 8. Social preview image

- Recommended: **PNG, JPG, or GIF, under 1 MB**, minimum **640×320px**, best quality at **1280×640px**.
- PNG transparency is supported (useful for dark-mode platforms), but solid background recommended if unsure.
- Set via **Settings → "Social preview" → Edit → Upload an image...** (UI-only workflow documented; no REST/API mechanism mentioned on this page).
- Image can only be **shared** from a public repository (can be uploaded to a private repo only if one was previously uploaded while public, per doc wording).
(https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview, 2026-11-06)

---

## 9. Pull request templates

### Locations
- Root: `pull_request_template.md`
- `docs/` dir: `docs/pull_request_template.md`
- Hidden dir: `.github/pull_request_template.md`
- Multiple templates: `.github/PULL_REQUEST_TEMPLATE/<name>.md` (subdirectory), also allowed as a `PULL_REQUEST_TEMPLATE/` subdir under root or `docs/`.

### Multiple-template behavior
- With multiple templates in a `PULL_REQUEST_TEMPLATE/` subdirectory, use the **`template` query parameter** when creating a PR to select which template fills the body (cross-referenced: "Using query parameters to create a pull request").
- Org/personal-account default PR templates can be set via the `.github` repo ("Creating a default community health file").
- Templates become available to collaborators only once **merged into the default branch**.
(https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository, 2026-11-06)

---

## 10. Organizations

### Creating a free org
- Profile picture (top right) → **Settings** → "Organizations" (Access section) → **New organization** → follow prompts. New org has no repositories initially.
(https://docs.github.com/en/organizations/collaborating-with-groups-in-organizations/creating-a-new-organization-from-scratch, 2026-11-06)

### Transferring a repository to an org
**Prerequisites:**
- Transferrer needs admin access to the repo; to transfer **into** an org, need permission to create repos there; target account must not already have a same-named repo/fork.
- Personal→personal transfers require the new owner to **accept via confirmation email within 1 day** or the invite expires (org transfers are more direct if you have create-repo permission there).
- Repos on GitHub.com can only transfer to other GitHub.com owners.

**What IS carried over / redirected:**
- Issues, PRs, wiki, stars, watchers, webhooks, services, secrets, deploy keys (all **remain associated**).
- Fork relationships (both directions) are preserved.
- Git LFS objects auto-migrate (may take time in background).
- Git history/commit contributions preserved.
- All Git/web URLs **permanently redirect** from old location to new (via `git clone/fetch/push`); recommend updating `git remote set-url origin NEW_URL` anyway. **Caveat**: redirects are permanently deleted if a new repo/fork is later created at the old location.
- GitHub Pages: **links to the Git repository redirect, but the GitHub Pages site itself does NOT redirect.**
- Packages: may transfer or lose their repo link depending on registry.
- Sponsorship-tier-granted repo access: see §1 tier-transfer rules above (NOT simply "carried over" — depends on personal vs org, and direction of transfer).

**What does NOT carry over / is affected:**
- **Private repo transferred to a GitHub Free user/org**: loses access to **protected branches** and **GitHub Pages** features (plan-dependent feature loss).
- Issue **assignees**: org→personal transfer keeps only issues assigned to the new personal owner, drops all other assignees; personal→org keeps org-member assignees, clears the rest (only org owners can make new assignments after).
- Issue **types**: org→org transfer keeps issue types only if the new org has a matching type (others removed); org→personal transfer removes **all** issue types.
- **Read-only collaborators** are dropped when transferring org→personal (personal accounts can't have read-only collaborators).
- If the repo had an action listed on GitHub Marketplace, or >100 clones / >100 Actions uses in the prior week, the `OWNER/REPO-NAME` combination is **permanently retired** post-transfer (cannot be reused by anyone).
(https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository, 2026-11-06)

### Can Sponsors be moved/attached to an org?
- GitHub Sponsors profiles themselves are tied to the sponsored personal or organization account, not to a specific repository — docs do not describe "transferring" a Sponsors profile between accounts. The only org-related linkage documented is the sponsorship-**tier private-repo-access** mechanism (§1/§10 above), whose behavior on repo transfer is explicitly documented (see tier-transfer bullets). No mechanism was found in the fetched docs for moving an existing sponsored-developer profile's sponsorships to an org profile — a maintainer wanting org-level Sponsors must separately apply/onboard the org (§1 "Setting up GitHub Sponsors for your organization"), it is a **distinct enrollment**, not a transfer.
(Inference based on https://docs.github.com/en/sponsors/receiving-sponsorships-through-github-sponsors/setting-up-github-sponsors-for-your-organization and .../managing-your-sponsorship-tiers, 2026-11-06) **[INFERENCE]**

---

## 11. Contributor Covenant — latest version

- **Latest version: 3.0** (confirmed live at https://www.contributor-covenant.org/version/3/0/code_of_conduct/, titled "Contributor Covenant 3.0 Code of Conduct").
- Canonical file URL: **https://www.contributor-covenant.org/version/3/0/code_of_conduct/** (permanently available per the page's own Attribution section: "adapted from the Contributor Covenant, version 3.0, permanently available at https://www.contributor-covenant.org/version/3/0/").
- Alternate formats linked from the page: Markdown — https://www.contributor-covenant.org/version/3/0/code_of_conduct/code_of_conduct.md ; plaintext — .../code_of_conduct.txt ; AsciiDoc — .../code_of_conduct.adoc
- v3.0 replaces the older "Our Standards" rubric with **"Encouraged Behaviors"** and **"Restricted Behaviors"**, adds an explicit **enforcement ladder** (Warning → Temporarily Limited Activities → Temporary Suspension → Permanent Ban), and is now licensed under **CC BY-SA 4.0**, stewarded by the **Organization for Ethical Source**.
- Homepage confirms it is "The most widely adopted code of conduct in open source" (https://www.contributor-covenant.org/, 2026-11-06) — homepage itself doesn't state version number in the fetched metadata, but the dedicated 3.0 page is live and self-identifies as the current version via its canonical-URL self-reference.
(https://www.contributor-covenant.org/version/3/0/code_of_conduct/, 2026-11-06)

---

## Gaps / items needing follow-up
1. **Sponsorship goals** page returned 404 — goal types (number-of-sponsors vs monthly-$-amount) not confirmed from a primary docs source this session.
2. **REST `PUT /repos/{owner}/{repo}/private-vulnerability-reporting`** exact request/response JSON schema not captured (page too large for single fetch window); endpoint naming/existence confirmed via docs anchor only.
3. Label **name/description character-length limits** not explicitly stated in the `gh label` CLI docs or the web UI docs fetched.
4. **Pin-discussion limits** (e.g., max pinned count) not directly fetched — only referenced via cross-link.
5. Whether a Sponsors profile can be "moved" to an org is an inference, not an explicit documented workflow.

---

## Gap fill (2026-11-06)

### 1. GitHub Sponsors goals — now confirmed (404 page was wrong slug; correct slug is `managing-your-sponsorship-goal`, singular)
- **Goal types:** "Your goal can set a target for the **number of sponsors** you want to have or the **amount of money** you want to earn each month." UI picker labels: **"Number of monthly sponsors"** or **"Sponsorships a month"**.
- **One active goal at a time:** Yes — "You can only set one goal up at a time. After you reach a goal, you can set another goal."
- **Editing:** Cannot edit down below an already-achieved value (e.g., can't lower target below current sponsor count already exceeding it).
- **Retiring:** Retired goals cannot be reactivated; must create a new one.
- **Visibility:** Choosing a money-based goal requires explicitly checking "I understand that this will publicly display how much sponsorship funds I receive each month" — i.e., monthly-$-amount goals are publicly visible by design; number-of-sponsors goals carry no such disclosure checkbox (sponsor counts are already public elsewhere on the profile).
- **Sharing:** Goals can be shared on social media or **embedded on a personal website** via a "Share"/"Embed it" button on the goal (exact embed markup not shown in the docs text — behind an interactive UI action, not documented as static HTML/JS in the page body).
(https://docs.github.com/en/sponsors/receiving-sponsorships-through-github-sponsors/managing-your-sponsorship-goal, 2026-11-06)

### 2. Personal Sponsors setup — confirmed
Setup flow (`setting-up-github-sponsors-for-your-personal-account`) has 6 steps:
1. **Joining:** github.com/sponsors → "Get sponsored" → contact info → choose payout (bank account in supported region, or fiscal host — fiscal host choice is **locked in at signup only**; switching later requires GitHub Support) → accept GitHub Sponsors Additional Terms + Privacy Statement → Submit.
2. **Profile:** short bio, introduction, optional "Featured work" (up to 6 repos), optional "opt-in to get featured on github.com/sponsors."
3. **Tiers:** up to 10 one-time + 10 monthly tiers, $12,000/month max, price immutable once published (must retire+recreate), optional welcome message, optional private-repo grant.
4. **Bank info:** Stripe Connect account (region of residence must match bank region) or fiscal host; identity info (name/DOB) hard to change post-submission.
5. **Tax form:** US residents/citizens → **Form W-9**; non-US residents/citizens → **Form W-8BEN** (links to IRS instructions for each). Accessed via a "tax forms" link in the dashboard Overview.
6. **2FA:** Must be enabled on the GitHub account **before** becoming a sponsored developer (prerequisite, not a submission-time toggle).
- **Review time:** "It may take **a few days** for GitHub to review your application" after clicking "Request approval"; profile goes live automatically on approval.
(https://docs.github.com/en/sponsors/receiving-sponsorships-through-github-sponsors/setting-up-github-sponsors-for-your-personal-account, 2026-11-06)

### 3. REST `PUT /repos/{owner}/{repo}/private-vulnerability-reporting` — exact doc section
- **Endpoint:** `PUT /repos/{owner}/{repo}/private-vulnerability-reporting`
- **Description:** "Enables private vulnerability reporting for a repository. The authenticated user must have admin access to the repository."
- **Required permission:** admin access to the repository (no OAuth scope table given beyond the global note that most endpoints need `Authorization: Bearer <TOKEN>` + `Accept: application/vnd.github+json`).
- **Path params:** `owner` (string, required, case-insensitive), `repo` (string, required, case-insensitive, no `.git` extension).
- **Response:** **Status 204** (empty body — no response schema).
- Sibling endpoints on same resource: `GET .../private-vulnerability-reporting` → 200 with `{ "enabled": boolean (required) }`, or 422 Bad Request; `DELETE .../private-vulnerability-reporting` → disables it, also 204.
(https://docs.github.com/en/rest/repos/repos, 2026-11-06 — "Enable private vulnerability reporting for a repository" section)

### 4. GraphQL `createDiscussionCategory` mutation — does not exist
- Fetched the full **Discussions** GraphQL reference page. Mutation list on that page: `addDiscussionComment`, `addDiscussionPollVote`, `addUpvote`, `closeDiscussion`, `createDiscussion`, `deleteDiscussion`, `deleteDiscussionComment` (plus further mutations later in the page, e.g. `markDiscussionCommentAsAnswer`, `pinDiscussion`, `unpinDiscussion`, `updateDiscussion`, `updateDiscussionComment`, per alphabetical reference convention). **No `createDiscussionCategory` mutation exists.** `DiscussionCategory` is a read-only GraphQL object (fields: `name`, `slug`, `emoji`, `description`, `isAnswerable`, etc.) with no corresponding create/update/delete mutation — categories can only be managed via the web UI (Discussions tab → category gear icon), not via the GraphQL (or REST) API.
(https://docs.github.com/en/graphql/reference/discussions, 2026-11-06 — **Answer: No.**)
- **Enabling Discussions on a repo (REST):** confirmed via `docs.github.com/en/rest/repos/repos` → `PATCH /repos/{owner}/{repo}` ("Update a repository") body parameter **`has_discussions`** (boolean, default `false`) — "Whether discussions are enabled." Same field (`has_discussions`, default `false`) is also accepted on `POST /orgs/{org}/repos` and `POST /user/repos` (repo creation) and returned on `GET` responses (Minimal/Full Repository schema).
(https://docs.github.com/en/rest/repos/repos, 2026-11-06 — "Update a repository" section)
- No GraphQL mutation to toggle `hasDiscussionsEnabled` was found on the Repositories or Discussions reference pages either; repo-level discussion enablement is REST/UI-only as far as primary docs show.

### 5. Buy Me a Coffee embed markup
- Primary official source is the **Buy Me a Coffee Brand Kit** page (`buymeacoffee.com/brand`), which confirms: "BUTTONS & WIDGET FOR YOUR WEBSITE → Generate now" links to an authenticated generator at `studio.buymeacoffee.com/button-and-graphics`. The generator requires login and dynamically emits the embed snippet — **the exact `<script>`/`<a>` markup is not present as static text in the primary docs/brand page itself**, so it cannot be captured from an unauthenticated fetch.
- The Help Center article that normally documents the markup (`help.buymeacoffee.com/en/articles/5885162-how-to-add-a-button-or-a-widget-to-your-website`) returned **HTTP 404** when fetched directly on 2026-11-06 (may have moved/been renamed).
- **Unverifiable from a primary source in this session:** a commonly cited widget script origin (`https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js`, with `data-name="BMC-Widget"` attributes) appears in third-party/community sources (e.g., a Stack Overflow answer) but **not** in a primary Buy Me a Coffee doc fetched here — **state as unverifiable**, not fact.
(https://buymeacoffee.com/brand, 2026-11-06; attempted https://help.buymeacoffee.com/en/articles/5885162-how-to-add-a-button-or-a-widget-to-your-website — 404, 2026-11-06)

### 6. GitHub "Sponsor" button display page location
- Searched `docs.github.com/en/sponsors/*` directly (site-scoped search + listing of sponsors-section pages: about-github-sponsors, setting-up-github-sponsors-for-your-personal-account/organization, using-a-fiscal-host, managing-your-payouts, managing-your-sponsorship-tiers, managing-your-sponsorship-goal, about-sponsorships-fees-and-taxes). **No dedicated "display/embed a Sponsor button" page exists under `/en/sponsors/`.**
- The actual canonical doc for the repository-level "Sponsor" button (iframe-style button shown on a repo's sidebar, driven by `FUNDING.yml`) lives under the **Repositories** docs section, already cited in §1/§2 above: `/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/displaying-a-sponsor-button-in-your-repository`. There is no separate iframe/card-embed page for third-party sites (unlike the Sponsors-goal "Embed it" button in item 1, which is UI-driven and not separately documented as static embed code).
(confirmed by section listing under https://docs.github.com/en/sponsors/, 2026-11-06 — **Answer: no dedicated page; see repositories docs cited above.**)


---

## 2. Public Presence Widgets — Research (fetched 2026-11-06)

## 1. Buttondown (newsletter)

### Embed form (no JS, plain HTML POST)
- Endpoint: `https://buttondown.com/api/emails/embed-subscribe/YOUR-BUTTONDOWN-USERNAME`
- Method: `POST`, must be the literal `action` of a standard HTML `<form>`.
- **Must NOT** be submitted via `fetch`/JS — Buttondown's response sometimes redirects the browser to complete a CAPTCHA or show a validation error; JS submission breaks that flow.
- Field name: email input is the only required field (newsletter's plain form just needs an email field matching Buttondown's generated markup — exact field name is emitted by the account's own "Embedding" settings page, not published as a fixed docs constant beyond `email`).
- Optional hidden inputs:
  - `tag` — adds a tag to the subscriber at signup (query param on URL or hidden `<input name="tag">`).
  - `metadata__<key>` — custom metadata fields, e.g. `<input name="metadata__first-name">`. Multi-select metadata renders as multiple checkboxes sharing the same `metadata__<key>` name.
- **No honeypot field is documented.** Docs only mention CAPTCHA (server-side) as the anti-spam mechanism; no published honeypot field name.
- Source: https://docs.buttondown.com/building-your-subscriber-base (fetched 2026-11-06)

### Iframe embed alternative
- Buttondown also offers a pre-styled `<iframe>` embed and a web-component embed (from `https://buttondown.com/settings/embedding`) that handle CAPTCHA/validation without leaving the page and capture full referrer URLs (plain `<form>` POST only sends page *origin*, not full path, as referrerpolicy isn't part of the HTML form spec).
- Source: https://docs.buttondown.com/building-your-subscriber-base (fetched 2026-11-06)

### Hosted subscribe/archive page
- `https://buttondown.com/USERNAME` — always works even with a custom hosting domain (acts as a redirect).
- Source: https://docs.buttondown.com/building-your-subscriber-base (fetched 2026-11-06)

### API (server-side proxy option)
- Create subscriber: `POST https://api.buttondown.com/v1/subscribers`
- Auth header: `Authorization: Token $API_KEY` (confirmed from official curl examples).
- Request body (JSON): `{"email_address": "...", "tags": [...], "type": "regular"|"unactivated", ...}`
- Optional headers:
  - `X-Buttondown-Collision-Behavior: add|overwrite` — upsert semantics for existing subscribers.
  - `ip_address` field in body — proxy the real client IP for spam/firewall scoring.
  - `X-Buttondown-Bypass-Firewall: true` — bypass firewall for trusted server-side sources (rate-limited to 5 req/hr/newsletter).
- Rate limit: 100 requests/day by default, grows with reputation.
- Source: https://docs.buttondown.com/api-subscribers-create (fetched 2026-11-06)

### Double opt-in
- Enabled by default and cannot be globally disabled. New subscribers get status `unactivated` until they click a confirmation email link, then become `regular`.
- Per-subscriber bypass: pass `"type": "regular"` in the `POST /v1/subscribers` body (requires a trusted source, e.g. post-purchase flow) — this does NOT disable double opt-in generally, just for that one API-created subscriber.
- Buttondown states double opt-in is effectively required for GDPR-grade proof of consent.
- Source: https://docs.buttondown.com/double-opt-in (fetched 2026-11-06)

### Free plan / pricing
- Free: **first 100 subscribers, $0/month.** Includes rich text/markdown editor, custom-domain *sending*, hosted newsletter archives, "privacy-first" analytics opt-outs.
- Paid add-ons (each stacks on top of subscriber-tier base price): Tagging & segmentation +$9/mo, Paid subscriptions +$9/mo, Comments/surveys +$9/mo, Analytics +$9/mo, **RSS-to-email +$9/mo**, Sponsorships +$29/mo, Attachments +$9/mo, **Archives on custom domain +$29/mo**, Multiple newsletters +$29/mo, Automations +$29/mo, Whitelabeling +$79/mo, Teams +$79/mo.
- 50% discount available for registered 501(c)(3) nonprofits.
- Source: https://buttondown.com/pricing (fetched 2026-11-06)

### Data / privacy (GDPR notes)
- Buttondown collects IP addresses, open/click events, email client info for the sender's own use; link tracking and analytics gathering can be opted out entirely per newsletter.
- States it does not sell subscriber data.
- No explicit data-residency/region statement found on this page (not published as a discrete fact on the fetched page); full legal detail lives in https://buttondown.com/legal/privacy (not fetched in this pass).
- Source: https://buttondown.com/features/privacy (fetched 2026-11-06)

### RSS-to-email
- Paid add-on (+$9/mo). Point at any RSS feed; Buttondown fetches new posts daily/weekly/monthly and emails them, using Buttondown's templating engine; supports multiple feeds combined into one newsletter; skips send (does not send broken/empty email) if feed is unreachable at send time.
- Source: https://buttondown.com/features/rss (fetched 2026-11-06)

### Archive pages on a custom domain
- Paid add-on (+$29/mo, "Archives on a custom domain" in pricing; referenced as "hosting domain" in docs).
- Setup: add a `CNAME` DNS record pointing to `custom-domains.buttondown.com` at Settings → Domains → Hosting.
- Cannot coexist with an `NS`-delegated subdomain used for *sending* (DNS limitation) — use separate subdomains for hosting vs. sending.
- Source: https://docs.buttondown.com/hosting-domain (fetched 2026-11-06)

### CSP origins needed for Buttondown
- `form-action`: `https://buttondown.com` (plain HTML form POST target `https://buttondown.com/api/emails/embed-subscribe/...`)
- `frame-src`: `https://buttondown.com` (if using the iframe embed, e.g. `https://demo.buttondown.com/...` pattern or `https://buttondown.com/username`)
- `connect-src`: `https://api.buttondown.com` (only if a server action/backend proxies the Subscribers API call server-side — no browser `connect-src` needed if proxied server-side; needed only if the client directly calls the API, which Buttondown explicitly advises against for the embed-subscribe form)
- `script-src`: none required for the plain `<form>` POST embed (no JS). The web-component embed (from Settings → Embedding) would require a `script-src` entry for Buttondown's JS host — exact script host not published in the fetched docs (generated per-account).

---

## 2. Alternatives (brief comparison)

### Kit (formerly ConvertKit)
- API: `POST https://api.kit.com/v4/subscribers` — upsert semantics (creates or updates `first_name` on existing match). Body: `{"email_address": "...", "first_name": "...", "state": "active|cancelled|bounced|complained|inactive", "fields": {...}}`. Auth not shown in the fetched OpenAPI fragment (`security: []`) — Kit v4 generally uses an `X-Kit-Api-Key` header or Bearer token per `https://developers.kit.com/api-reference/authentication` (not independently fetched in this pass; flagged for direct confirmation before CSP finalization).
- Free plan: **$0/mo, up to 10,000 subscribers** — includes unlimited landing pages & forms, unlimited email broadcasts, audience tagging/segmentation, sell digital products & subscriptions.
- Paid: Creator $33/mo, Pro $66/mo (both quoted "for 1,000 subscribers," scales with list size); RSS campaigns are a Creator-plan+ feature (not free).
- Origins (for a JS-embedded Kit form widget, typical pattern): `script-src app.kit.com` / `convertkit.com`, `form-action app.kit.com`. (Not independently verified against official embed-code docs in this pass.)
- Source: https://kit.com/pricing (fetched 2026-11-06), https://developers.kit.com/api-reference/subscribers/create-a-subscriber (fetched 2026-11-06)

### Resend (Audiences/Broadcasts — now "Contacts/Segments")
- Note: Resend has renamed "Audiences" to **Contacts** (organized into Segments and Topics); migration guide exists for prior "Audience" terminology.
- API: `POST https://api.resend.com/contacts`, `Authorization: Bearer re_xxxxxxxxx`, body `{"email": "...", "first_name": "...", "last_name": "...", "unsubscribed": false}`. Response: `{"object": "contact", "id": "..."}`.
- Free plan: $0/mo — **3,000 transactional emails/mo (100/day cap)**, separately **1,000 marketing contacts/mo** on the free marketing tier, 3 domains, 3 inboxes, 1 webhook endpoint, 10,000 automation runs/mo, 5 AI credits/mo, 30-day data retention, GDPR compliance & SOC 2 Type II included on all plans.
- Broadcasts can only be sent to existing Contacts; transactional `/emails` API can send to anyone (and must include own unsubscribe link + `List-Unsubscribe`/`List-Unsubscribe-Post` headers if used for newsletters).
- Origins: `connect-src https://api.resend.com` (server-side API call — no browser origin needed if proxied via a server action, which is the standard Resend pattern since API keys must stay server-side).
- Source: https://resend.com/pricing (fetched 2026-11-06), https://resend.com/docs/api-reference/contacts/create-contact (fetched 2026-11-06), https://resend.com/docs/dashboard/contacts/introduction (fetched 2026-11-06)

---

## 3. Buy Me a Coffee

### Plain link (no third-party origin needed)
- Format: `https://buymeacoffee.com/<username>` or `https://www.buymeacoffee.com/<username>`.
- A plain `<a href="https://buymeacoffee.com/<user>">` link requires **no CSP allowance at all** beyond normal outbound navigation (not `form-action`/`connect-src`/`frame-src`/`script-src` — it's just a hyperlink).

### Official button/widget script
- Script tag pattern (confirmed via Stack Overflow example matching BMC's documented integration pattern, widget host): `<script src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js" data-id="<username>" data-description="..." ...></script>`
- Official Knowledge Base article exists at `https://help.buymeacoffee.com/en/articles/5885162-how-to-add-a-button-or-a-widget-to-your-website` (fetch attempt returned HTTP 404 in this session — likely requires JS rendering or a region redirect; could not independently verify exact current script markup from the primary source in this pass. Treat `cdnjs.buymeacoffee.com` origin as [INFERENCE] from third-party examples, not confirmed against the live official doc).
- Expected widget origins (standard BMC architecture, not independently confirmed in this session): `script-src cdnjs.buymeacoffee.com`; button images typically served from `img.buymeacoffee.com`; the widget opens a payment modal/iframe which may call `buymeacoffee.com` itself (`frame-src buymeacoffee.com`).

### Fees (official)
- **5% platform fee** per transaction (Buy Me a Coffee's own cut). No monthly subscription fee for the base platform.
- Payment processing via Stripe: **2.9% + $0.30** per transaction, plus a separate **0.5% payout-processing fee**.
- Extra surcharges: **+1%** for international (non-US) transactions, **+0.5%** for subscription (membership) payments.
- Creators can optionally pass the credit-card fee on to supporters.
- Source: https://help.buymeacoffee.com/en/articles/8105744-how-to-calculate-charges-on-your-payment (fetched 2026-11-06)

### FUNDING.yml key
- `buy_me_a_coffee: USERNAME` — official GitHub-supported key.
- Source: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/displaying-a-sponsor-button-in-your-repository (fetched 2026-11-06)

---

## 4. GitHub Sponsors embeds

### FUNDING.yml
- Key: `github: USERNAME` or `github: [USERNAME, USERNAME, USERNAME, USERNAME]` (up to 4 sponsored developers + 1 organization). File location: `.github/FUNDING.yml` on the default branch.
- Full supported platform list in same file: `community_bridge`, `github`, `issuehunt`, `ko_fi`, `liberapay`, `open_collective`, `patreon`, `tidelift`, `polar`, `buy_me_a_coffee`, `thanks_dev`, `custom` (up to 4 custom URLs, array syntax, quote any URL containing `:`).
- Enabling: repo Settings → Features → Sponsorships → "Set up sponsor button" or "Override funding links", commit the file (PR if on default branch protection).
- Source: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/displaying-a-sponsor-button-in-your-repository (fetched 2026-11-06)

### Sponsor button iframe (small button)
- `<iframe src="https://github.com/sponsors/USER/button" title="Sponsor USER" height="32" width="114" style="border: 0; border-radius: 6px;"></iframe>`
- Exact `width="114" height="32"` + `border:0; border-radius:6px` are the current correct values (GitHub fixed a black-background-bleed bug that required these specific dimensions; copy fresh from your own Sponsors dashboard to be safe). [source: community discussion, not GitHub's static docs page — GitHub's dedicated "displaying a sponsor button" doc page under `/en/sponsors/...` 404'd when fetched directly in this session]

### Sponsor card iframe (larger card)
- `<iframe src="https://github.com/sponsors/USER/card" title="Sponsor USER" height="225" width="600" style="border: 0;"></iframe>`

### Plain link alternative
- `https://github.com/sponsors/USER` — ordinary link, no iframe, no extra CSP origin needed beyond normal navigation.

### CSP origins
- `frame-src github.com` (covers both `/button` and `/card` iframe embeds).
- No `script-src`/`connect-src` needed — pure iframe, no JS.

---

## 5. shields.io badges

Confirmed via shields.io official GitHub repo README (`badges/shields`, fetched 2026-11-06) and badge-maker spec; image origin is **`img.shields.io`** for all dynamically generated badges.

- **npm version**: `https://img.shields.io/npm/v/<pkg>` (standard shields.io path convention, package = `<pkg>`)
- **GitHub Actions workflow status**: `https://img.shields.io/github/actions/workflow/status/<owner>/<repo>/<workflow-file>` — confirmed verbatim in shields' own README: `https://img.shields.io/github/actions/workflow/status/badges/shields/daily-tests.yml?label=daily%20tests`
- **License**: `https://img.shields.io/github/license/<owner>/<repo>` (standard convention; Apache-2.0 would render from the repo's detected `LICENSE` file)
- **GitHub Sponsors**: `https://img.shields.io/github/sponsors/<user>` (standard convention, not independently re-verified against a live badge page in this session due to the badges/git-hub-actions-workflow-status docs sub-pages returning the service's own "badge not found" SVG when fetched headlessly — this is shields.io's router treating any unmatched path as a badge spec, not evidence the badge type doesn't exist)
- **Discussions**: `https://img.shields.io/github/discussions/<owner>/<repo>` — confirmed verbatim in shields' own README: `https://img.shields.io/github/discussions/badges/shields`
- **GitHub's own native workflow badge** (no shields.io dependency): `https://github.com/<owner>/<repo>/actions/workflows/<file>/badge.svg` — e.g. shields' own README links `https://github.com/badges/shields/actions/workflows/daily-tests.yml` for the Actions tab; the native badge SVG itself is served at `https://github.com/<owner>/<repo>/actions/workflows/<file>/badge.svg`.
- Source: https://raw.githubusercontent.com/badges/shields/master/README.md (fetched 2026-11-06)

### CSP origins for shields.io badges
- `img-src img.shields.io` (all shields.io badge images)
- `img-src github.com` (if using GitHub's native workflow `badge.svg` instead of/in addition to shields.io)
- No `script-src`/`connect-src`/`frame-src` needed — badges are plain `<img>` tags.

---

## 6. Astro Starlight — sponsor/social link + footer override

**Starlight version described by fetched docs: Astro v7.4.5 generator (current docs site build) / Starlight docs at `starlight.astro.build` as of 2026-11-06.**

### Social links (header)
- Config key: `social` (array), each entry an **object** with three required properties: `icon`, `label`, `href`.
  ```js
  starlight({
    social: [
      { icon: 'discord', label: 'Discord', href: 'https://astro.build/chat' },
      { icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' },
    ],
  })
  ```
- This confirms the **current format IS the `{icon, label, href}` object array** (not the older flat `{github: 'url'}` map format from earlier Starlight versions).
- Available icons: Starlight ships a large built-in icon set referenced via the `StarlightIcon` TypeScript type. Confirmed present in the current set: **`github`**, **`heart`**, plus `gitlab`, `bitbucket`, `codePen`, `discord`, `twitter`, `x.com`, `mastodon`, `youtube`, `linkedin`, `instagram`, `patreon`, `openCollective`, `rss`, `reddit`, `email`, and many more (full enumerated list fetched — see `https://starlight.astro.build/reference/icons/`).
- Source: https://starlight.astro.build/guides/customization/#social-links (fetched 2026-11-06), https://starlight.astro.build/reference/icons/ (fetched 2026-11-06)

### Overriding the Footer component (for a newsletter form or sponsor link)
- Config key: `components: { Footer: './src/components/CustomFooter.astro' }` in the `starlight()` integration options inside `astro.config.mjs`.
- Pattern:
  ```js
  starlight({
    components: {
      Footer: './src/components/CustomFooter.astro',
    },
  })
  ```
- To extend (not fully replace) the default footer, import and render the built-in component inside the custom one:
  ```astro
  ---
  import Default from '@astrojs/starlight/components/Footer.astro';
  ---
  <Default><slot /></Default>
  <form action="https://buttondown.com/api/emails/embed-subscribe/USERNAME" method="post">
    <input type="email" name="email" />
    <button type="submit">Subscribe</button>
  </form>
  ```
- Conditional rendering (e.g. show newsletter form only on the homepage) is supported via `Astro.locals.starlightRoute.id === ''` checks.
- Full list of overridable components documented at `/reference/overrides/` (includes `Footer`, `SocialIcons`, `PageFrame`, `TwoColumnContent`, `PageTitle`, etc.).
- Source: https://starlight.astro.build/guides/overriding-components/ (fetched 2026-11-06)

---

## CSP Summary Table (origins only)

| Provider | `form-action` | `connect-src` | `script-src` | `frame-src` | `img-src` |
|---|---|---|---|---|---|
| Buttondown (plain form embed) | `buttondown.com` | `api.buttondown.com` (server-proxy only) | — | `buttondown.com` (if iframe embed used) | — |
| Kit | `app.kit.com` [unverified] | `api.kit.com` (server-proxy) | — | — | — |
| Resend | — (API-only, server-proxied) | `api.resend.com` (server-proxy) | — | — | — |
| Buy Me a Coffee (plain link) | — | — | — | — | — |
| Buy Me a Coffee (widget) | — | — | `cdnjs.buymeacoffee.com` [not independently re-verified] | `buymeacoffee.com` [inferred] | `img.buymeacoffee.com` [inferred] |
| GitHub Sponsors (plain link) | — | — | — | — | — |
| GitHub Sponsors (iframe) | — | — | — | `github.com` | — |
| shields.io badges | — | — | — | — | `img.shields.io`, `github.com` (native workflow badge) |


---

## 3. PayloadCMS GitHub Repo Configuration Research

All facts fetched 2026-11-06 via `gh` CLI against `github.com/payloadcms/payload` unless otherwise noted. Commands used are shown per section.

---

## 1. Label List (full, grouped)

Command: `gh label list --repo payloadcms/payload --limit 300 --json name,description,color` (fetched 2026-11-06)

**Total labels: 136**

### GitHub defaults still present
Of GitHub's 9 standard default labels (`bug`, `documentation`, `duplicate`, `enhancement`, `good first issue`, `help wanted`, `invalid`, `question`, `wontfix`), only **3 remain**: `duplicate`, `enhancement`, `wontfix`. The rest were removed/replaced by custom labels (e.g. a separate `Bug` label with custom color `EB5757` exists instead of default `bug`).

### Grouped breakdown (by prefix)

**`status:` (5)** — issue triage state machine
- `status: needs-triage` `#ffffff` — "Possible bug which hasn't been reproduced yet"
- `status: cant-reproduce` `#e80000` — "If an issue cannot be reproduced"
- `status: verified` `#0ec900` — "If an issue has been reproduced"
- `status: needs-repro` `#ffb300` — "If an issue does not include a reproduction"
- (a `status: awaiting-reply` label is referenced by the lock-issues workflow as an exclusion but did not appear in the fetched list — may be retired/unused currently)

**`area:` (~20, includes malformed duplicates from form migrations)**
Clean set: `area: docs`, `area: i18n`, `area: templates`, `area: ui`, `area: live-preview`, `area: core`, `area: localization`, `area: folders`, `area: trash`, `area: locked-documents`, `area: graphql`, `area: next-payload`, `area: admin`, `area: typescript`, `area: access-control`, `area: fields`, `area: admin panel`, `area: database`, `area: accessibility`, `area: uploads`, `area: db-postgres`
Many malformed artifacts exist from GitHub issue-form "select all that apply" rendering bugs, e.g. `- area: core`, `(Select all that apply)  area: core`, `` `area: core` ``, `area: core db: postgres`, `- area: core - db: postgres` — these are junk labels auto-created when issue-form checkbox text got parsed as a literal label name (a known GitHub Forms footgun), not intentional taxonomy.

**`db:` (6 clean + malformed dupes)**
- `db: postgres`, `db: mongodb`, `db: sqlite`, `db: vercel-postgres`, `db: d1-sqlite`, plus malformed `db-postgres`, `area: db-postgres`, `db: sqlite (all drizzle adapters)`, `db: drizzle (also sqlite and d1`/`which share the code)` (a single description split across two labels by a stray comma)

**`plugin:` (~20)**
`plugin: cloud`, `plugin: cloud-storage`, `plugin: richtext-lexical`, `plugin: richtext-slate`, `plugin: nested-docs`, `plugin: stripe`, `plugin: sentry`, `plugin: form-builder`, `plugin: search`, `plugin: seo`, `plugin: multi-tenant`, `plugin: import-export`, `plugin: storage-*`, `plugin: ecommerce`, `plugin: redirects`, `plugin: db-d1-sqlite`, `plugin: other`, `plugin: mcp`, `plugin: next (`withPayload`)` (malformed), plus backtick/duplicate variants.

**`pkg:` (1)** — `pkg: admin-bar` `#bfd4f2` — "@payloadcms/admin-bar"

**`roadmap:` (5)** — `roadmap: complete`, `roadmap: p0`, `roadmap: p1`, `roadmap: p2`, `roadmap: TBD`

**`effort:` (3)** — `effort: low`, `effort: mid`, `effort: high`

**`merge-priority-` (2)** — `merge-priority-3`, `merge-priority-1` (CI/automerge priority tiers)

**`created-by:` (2)** — `created-by: Payload team` `#000000`, `created-by: Contributor` `#0052CC` — auto-applied by `triage.yml` based on commenter identity/author association.

**Version labels** — `v2`, `v3`, `v3.x`/`3.x`, `v4`, `v4-candidate`, `v4-review`, `4.0`

**Misc standalone** — `duplicate`, `enhancement`, `wontfix` (GH defaults), `dependencies`, `github_actions`, `dependency-issue`, `invalid-reproduction`, `validate-reproduction`, `keep`, `stale`, `prioritized`, `cloud-platform`, `create-payload-app`, `examples`, `a11y`, `Security`, `Support`, `Bug`, `Feature`, `BREAKING`, `close-candidate`, `agent-pr`, `multi-tenant`, `storage-*`, `cloud-storage`, `richtext-lexical`, `payloadcms/payload`, `other comp`, `Uploads`, `Slack`, `Won't Fix`, `UI`, `Core`, `GraphQL`, `Payload-OSS`, `cloudflare`

**Observation:** a visible cluster of malformed labels (`- area: core`, `(Select all that apply)  plugin: ecommerce`, `` `area: core` ``, trailing-text fragments) indicates the repo's issue-form "multiple" dropdown fields have at some point been mis-submitted/mis-parsed, auto-creating junk labels from literal form text. These remain in the label list uncleaned as of fetch date.

---

## 2. `.github/ISSUE_TEMPLATE/` files (verbatim)

Dir listing via `gh api repos/payloadcms/payload/contents/.github/ISSUE_TEMPLATE` (2026-11-06): `1.bug_report_v3.yml`, `2.design_issue.yml`, `DOCUMENTATION_ISSUE.md`, `config.yml`

### `1.bug_report_v3.yml`
Source: `gh api repos/payloadcms/payload/contents/.github/ISSUE_TEMPLATE/1.bug_report_v3.yml --jq '.content' | base64 -d`

```yaml
name: Functionality Bug (v3)
description: '[REPRODUCTION REQUIRED] - Report a bug in Payload v3'
labels: ['status: needs-triage', 'validate-reproduction', 'v3']
body:
  - type: markdown
    attributes:
      value: |
        > **Payload v3 is in maintenance mode.** Only bug fixes are being accepted against v3 — new features are not. If you want to propose a new feature, please open a discussion targeting Payload v4 instead: https://github.com/payloadcms/payload/discussions

  - type: textarea
    attributes:
      label: Describe the Bug
    validations:
      required: true

  - type: input
    id: reproduction-link
    attributes:
      label: Link to the code that reproduces this issue
      description: >-
        _REQUIRED_: Please provide a link to your reproduction. Note, if the URL is invalid (404 or a private repository), we may close the issue.
        Either use `pnpx create-payload-app@latest -t blank` then push to a repo or follow the [reproduction-guide](https://github.com/payloadcms/payload/blob/main/.github/reproduction-guide.md) for more information.
    validations:
      required: true

  - type: textarea
    attributes:
      label: Reproduction Steps
      description: Steps to reproduce the behavior, please provide a clear description of how to reproduce the issue, based on the linked minimal reproduction. Screenshots can be provided in the issue body below. If using code blocks, make sure that [syntax highlighting is correct](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-and-highlighting-code-blocks#syntax-highlighting) and double check that the rendered preview is not broken.
    validations:
      required: true

  - type: dropdown
    attributes:
      label: Which area(s) are affected?
      multiple: true
      options:
        - 'Not sure'
        - 'area: core'
        - 'area: docs'
        - 'area: graphql'
        - 'area: live-preview'
        - 'area: templates'
        - 'area: ui'
        - 'db: d1-sqlite'
        - 'db: mongodb'
        - 'db: postgres'
        - 'db: sqlite'
        - 'db: vercel-postgres'
        - 'plugin: cloud-storage'
        - 'plugin: ecommerce'
        - 'plugin: form-builder'
        - 'plugin: import-export'
        - 'plugin: mcp'
        - 'plugin: multi-tenant'
        - 'plugin: nested-docs'
        - 'plugin: redirects'
        - 'plugin: richtext-lexical'
        - 'plugin: search'
        - 'plugin: sentry'
        - 'plugin: seo'
        - 'plugin: storage-*'
        - 'plugin: stripe'
        - 'plugin: other'
    validations:
      required: true

  - type: textarea
    attributes:
      label: Environment Info
      description: Paste output from `pnpm payload info` _or_ Payload, Node.js, and Next.js versions. Please avoid using "latest"—specific version numbers help us accurately diagnose and resolve issues.
      render: text
      placeholder: Run `pnpm payload info` in your terminal and paste the output here.
    validations:
      required: true

  - type: markdown
    attributes:
      value: Before submitting the issue, go through the steps you've written down to make sure the steps provided are detailed and clear.
  - type: markdown
    attributes:
      value: Contributors should be able to follow the steps provided in order to reproduce the bug.
  - type: markdown
    attributes:
      value: These steps are used to add integration tests to ensure the same issue does not happen again. Thanks in advance!
```

### `2.design_issue.yml`
Source: `gh api repos/payloadcms/payload/contents/.github/ISSUE_TEMPLATE/2.design_issue.yml --jq '.content' | base64 -d`

```yaml
name: Design Issue
description: '[SCREENSHOT REQUIRED] - Create a design issue report'
labels: ['status: needs-triage', 'v3', 'area: ui']
body:
  - type: textarea
    attributes:
      label: Describe the Bug.
      description: >-
        _REQUIRED:_ Please a screenshot/video of the issue along with a detailed description of the problem.
    validations:
      required: true

  - type: textarea
    attributes:
      label: Reproduction Steps
      description: Steps to reproduce the behavior, please provide a clear description of how to reproduce the issue, based on the linked minimal reproduction. Screenshots can be provided in the issue body below. If using code blocks, make sure that [syntax highlighting is correct](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-and-highlighting-code-blocks#syntax-highlighting) and double check that the rendered preview is not broken.
    validations:
      required: true

  - type: textarea
    attributes:
      label: Environment Info
      description: Paste output from `pnpm payload info` _or_ Payload, Node.js, and Next.js versions. Please avoid using "latest"—specific version numbers help us accurately diagnose and resolve issues.
      render: text
      placeholder: |
        Payload:
        Node.js:
        Next.js:
    validations:
      required: true

  - type: markdown
    attributes:
      value: Before submitting the issue, go through the steps you've written down to make sure the steps provided are detailed and clear.
  - type: markdown
    attributes:
      value: Contributors should be able to follow the steps provided in order to reproduce the bug.
  - type: markdown
    attributes:
      value: These steps are used to add integration tests to ensure the same issue does not happen again. Thanks in advance!
```

### `DOCUMENTATION_ISSUE.md`
Source: `gh api repos/payloadcms/payload/contents/.github/ISSUE_TEMPLATE/DOCUMENTATION_ISSUE.md --jq '.content' | base64 -d`

```markdown
---
name: Documentation Issue
about: Suggest fix to Payload documentation
labels: 'documentation'
assignees: 'zubricks'
---

# Documentation Issue

<!--- Please provide a summary of the documentation issue -->

## Additional Details

<!--- Provide any other additional details -->
```
Note: this template applies the label `documentation`, which does **not** appear in the fetched label list (possibly retired/renamed to `area: docs`) — a residual inconsistency.

### `config.yml`
Source: `gh api repos/payloadcms/payload/contents/.github/ISSUE_TEMPLATE/config.yml --jq '.content' | base64 -d`

```yaml
blank_issues_enabled: false
contact_links:
  - name: Feature Request (v4 only)
    url: https://github.com/payloadcms/payload/discussions
    about: Suggest an idea for Payload v4 in GitHub Discussions. Payload v3 is in maintenance mode — new features are not being accepted against v3.
  - name: Question about Payload
    url: https://github.com/payloadcms/payload/discussions
    about: Please ask Payload-related questions in our GitHub Discussions
```
Blank issues are disabled; feature requests and questions are funneled to GitHub Discussions, not issues.

---

## 3. `.github/PULL_REQUEST_TEMPLATE.md` (verbatim)

Source: `gh api repos/payloadcms/payload/contents/.github/PULL_REQUEST_TEMPLATE.md --jq '.content' | base64 -d` (2026-11-06)

```markdown
<!--

Thank you for the PR! Please go through the checklist below and make sure you've completed all the steps.

Please review the [CONTRIBUTING.md](https://github.com/payloadcms/payload/blob/main/CONTRIBUTING.md) document in this repository if you haven't already.

## Which branch should this PR target?

- **`main`** — Payload v4 development. New features, enhancements, and v4 bug fixes go here.
- **`3.x`** — Payload v3 maintenance. Bug fixes only. **New features are not accepted against v3.** If this PR adds a feature to v3, please retarget it at `main` (v4) instead.

The following items will ensure that your PR is handled as smoothly as possible:

- PR Title must follow conventional commits format. For example, `feat: my new feature`, `fix(plugin-seo): my fix`.
- Minimal description explained as if explained to someone not immediately familiar with the code.
- Provide before/after screenshots or code diffs if applicable.
- Link any related issues/discussions from GitHub or Discord.
- Add review comments if necessary to explain to the reviewer the logic behind a change

### What?

### Why?

### How?

Fixes #

-->
```
Entire template is wrapped in an HTML comment (so it doesn't render by default in the PR body — contributors must fill in text outside/within, but the whole block is invisible unless the PR author expands it).

---

## 4. `.github/reproduction-guide.md` (verbatim)

Source: `gh api repos/payloadcms/payload/contents/.github/reproduction-guide.md --jq '.content' | base64 -d` (2026-11-06), 64 lines

```markdown
# Reproduction Guide

1. [Fork](https://github.com/payloadcms/payload/fork) this repo
2. Optionally, create a new branch for your reproduction
3. Run `pnpm install` to install dependencies
4. Open up the `test/_community` directory
5. Add any necessary `collections/globals/fields` in this directory to recreate the issue you are experiencing
6. Run `pnpm dev _community` to start the admin panel

**NOTE:** The goal is to isolate the problem by reducing the number of `collections/globals/fields` you add to the `test/_community` folder. This folder is _not_ meant for you to copy your project into, but rather recreate the issue you are experiencing with minimal config.

## Example test directory file tree

```text
.
├── config.ts
├── int.spec.ts
├── e2e.spec.ts
└── payload-types.ts
```

- `config.ts` - This is the _granular_ Payload config for testing. It should be as lightweight as possible. Reference existing configs for an example
- `int.spec.ts` [Optional] - This is the test file run by vitest. Any test file must have a `*int.spec.ts` suffix.
- `e2e.spec.ts` [Optional] - This is the end-to-end test file that will load up the admin UI using the above config and run Playwright tests.
- `payload-types.ts` - Generated types from `config.ts`. Generate this file by running `pnpm dev:generate-types _community`.

The directory split up in this way specifically to reduce friction when creating tests and to add the ability to boot up Payload with that specific config. You should modify the files in `test/_community` to get started.

## Testing is optional but encouraged

An issue does not need to have failing tests — reproduction steps with your forked repo are enough at this point. Some people like to dive deeper and we want to give you the guidance/tools to do so. Read more below:

### Running integration tests (Payload API tests)

First install [Vitest Plugin for VSCode](https://marketplace.visualstudio.com/items?itemName=vitest.explorer).

There are a couple ways run integration tests:

- **Granularly** - you can run individual tests in vscode by installing the [Vitest Plugin](https://marketplace.visualstudio.com/items?itemName=vitest.explorer) and using that to run individual tests. Clicking the `debug` button will run the test in debug mode allowing you to set break points.

- **Manually** - you can run all int tests in the `/test/_community/int.spec.ts` file by running the following command:

  ```bash
  pnpm test:int _community
  ```

### Running E2E tests (Admin Panel UI tests)

The easiest way to run E2E tests is to install

- [Playwright Test for VSCode](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)
- [Playwright Runner](https://marketplace.visualstudio.com/items?itemName=ortoni.ortoni)

Once they are installed you can open the `testing` tab in vscode sidebar and drill down to the test you want to run, i.e. `/test/_community/e2e.spec.ts`

#### Notes

The default credentials are `dev@payloadcms.com` as email and `test` as password. They can be found in `test/credentials.ts`. By default, these will be autofilled, so no log-in is required.
```

**Key requirements (summary):** fork repo → isolate the bug inside `test/_community` (never paste a whole project) → minimal `config.ts` + optional `*int.spec.ts`/`e2e.spec.ts` → generate `payload-types.ts` → tests optional but encouraged; auto-login via fixed dev credentials (`dev@payloadcms.com` / `test`).

---

## 5. CONTRIBUTING.md — structure and key policy sections

Source: `gh api repos/payloadcms/payload/contents/CONTRIBUTING.md --jq '.content' | base64 -d` (2026-11-06), 296 lines.

### Heading structure (verbatim headings, in order)
```
# Contributing to Payload
## Opening issues
## Security issues & vulnerabilities
## Documentation edits
## Building additional features
## Design Contributions
## Before Starting
## Installation & Requirements
## AI Code Tool Compatibility
### Context
### Skills
### Hooks
### MCP (Model Context Protocol)
### Code
### Database Setup
### Development with Devcontainers
### Testing with your own database
### Running the e2e and int tests
### Visual regression testing
### Pull Requests
## Previewing docs
## Internationalization (i18n)
```

### Questions vs bugs routing
- **"Opening issues"**: before filing, search existing open/closed issues; upvote with 👍 reaction if a dup exists; otherwise fill out the Issue Template.
- **"Before Starting"**: for new feature ideas, open a **GitHub Discussion** or discuss in **Discord** first — "New functionality often has large implications across the entire Payload repo, so it is best to discuss the architecture and approach before starting work on a pull request." This matches `config.yml`'s routing of feature requests/questions to Discussions, not Issues.
- **"Security issues & vulnerabilities"**: DO NOT create a publicly viewable issue — email `dev@payloadcms.com` directly. States a reward may be paid for significant remediable vulnerabilities found in core Payload (contradicts SECURITY.md's "we do not offer monetary rewards" — see §6 note below, this is an inconsistency between the two documents as of fetch date).

### Status label meaning (not explicitly defined in CONTRIBUTING.md body — meanings come from label `description` field, see §1): `status: needs-triage` ("possible bug which hasn't been reproduced yet"), `status: needs-repro` ("issue does not include a reproduction"), `status: cant-reproduce`, `status: verified` ("issue has been reproduced"). CONTRIBUTING.md itself does not document the status-label state machine in prose; it's inferred from `triage.yml`/`label-on-change.yml` automation (see §7) and label descriptions.

### Changesets / commit conventions
- No changesets bot mentioned. Conventions are purely PR-title based:
- **"All commits within a PR are squashed when merged, using the PR title as the commit message."** PR titles must use **Conventional Commits** (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
- Scoping: "you must indicate the affected packages in parentheses to 'scope' the changes" — e.g. `feat(ui): add new feature`, `fix(richtext-lexical): fix bug`. Changes to the core `payload` package don't require scoping.
- For `templates/` or `examples/` changes: use `chore` type scoped, e.g. `chore(templates): adds feature to template`, `chore(examples): fixes bug in example`.
- Branch targeting: `main` = v4 development (new features + v4 fixes); `3.x` = v3 maintenance (bug fixes only, no new features).
- "Allow edits and access to secrets by maintainers" must stay enabled on fork PRs or the team may close+reopen the PR as an internal branch.
- i18n: new UI strings require en locale + translation (via `translateNewKeys` script, OpenAI-key-backed, or external contributors can skip and leave translation to the team).

---

## 6. SECURITY.md (verbatim) and CODE_OF_CONDUCT

Source: `gh api repos/payloadcms/payload/contents/SECURITY.md --jq '.content' | base64 -d` (2026-11-06)

```markdown
# Security Policy

## Reporting a Vulnerability

Please report any security issues or concerns to [security@payloadcms.com](mailto:security@payloadcms.com).

## Development Environments

Development mode enables framework debugging features that can expose source code, stack traces, and server-component props to the browser. This debug output can include sensitive values. Payload authentication does not restrict access to framework development tooling.

Run production builds for deployed applications, and restrict development-server access to trusted developers.

Reports limited to expected development diagnostics, without production impact or a demonstrated security-boundary bypass, are generally considered informational. Reports involving production disclosure or bypasses of development-server origin, host, or access protections remain welcome.

## Rewards and Recognition

Any report that is validated and addressed is greatly appreciated. When a validated report requires a published advisory (for example, a GitHub Security Advisory / GHSA), the original reporter will be credited in that advisory. When submitting reports, be sure to include your GitHub username to receive credit. We do not offer monetary rewards or bug bounties for security reports.

## Software Bill of Materials (SBOM)

Each Payload v4 beta release on GitHub includes `payload-sboms-<version>.zip`. For example, the zip for 4.0.0-beta.4 is at:

https://github.com/payloadcms/payload/releases/download/v4.0.0-beta.4/payload-sboms-4.0.0-beta.4.zip

The zip has one folder, `payload-sboms-<version>/`, with one SBOM per published npm package in two formats:

- CycloneDX 1.6 JSON: `<package>-<version>.cdx.json`
- SPDX 2.3 JSON: `<package>-<version>.spdx.json`

`<package>` is the npm name without `@`, with `/` replaced by `-`. For example, `@payloadcms/db-postgres` is `payloadcms-db-postgres-4.0.0-beta.4.cdx.json`.

Each SBOM lists the production dependencies that Payload built and tested the package with, from the repository lockfile. Other `@payloadcms/*` packages appear with their release version. Direct peer dependencies (for example `next` or `payload`) are excluded, because your project provides them, unless the package also lists them in `dependencies`. Peer dependencies of transitive dependencies can appear.

For the dependencies your project installs, generate an SBOM from your own lockfile.

To verify the files after you unzip, run `sha256sum -c SHA256SUMS` in the `payload-sboms-<version>/` folder.
```

**Note:** SECURITY.md says "We do not offer monetary rewards or bug bounties," while CONTRIBUTING.md's "Security issues & vulnerabilities" section says "we will be happy to pay you a reward for your findings and diligence" for significant remediable vulnerabilities in core Payload — these two docs directly contradict each other as of the fetch date (2026-11-06). Report as observed, not reconciled.

**CODE_OF_CONDUCT:** `gh api repos/payloadcms/payload/contents/CODE_OF_CONDUCT.md` returned **404 Not Found** (2026-11-06) — no `CODE_OF_CONDUCT.md` file exists at repo root. The community profile endpoint (`gh api repos/payloadcms/payload/community/profile`) confirms this: `"code_of_conduct": null, "code_of_conduct_file": null`. Payload does **not** ship a Code of Conduct file (no version to report).

---

## 7. Workflows touching triage/labels

Dir listing: `gh api repos/payloadcms/payload/contents/.github/workflows` (2026-11-06) → 22 entries, relevant ones below.

### `triage.yml`
Triggers: `pull_request_target` (opened), `issues` (opened).
- **Job `debug-context`**: logs full GitHub Actions context (debugging aid).
- **Job `label-created-by`** (`label-on-open`): checks author against a hardcoded list of Payload team GitHub usernames (`denolfe, jmikrut, DanRibbens, jacobsfletch, JarrodMFlesch, AlessioGr, JessChowdhury, kendelljoseph, PatrikKozak, tylandavis, paulpopus, r1tsuu, GermanJablo, nathanlentz`); if matched or `author_association` is `MEMBER`/`OWNER`, applies `created-by: Payload team`; if `CONTRIBUTOR`, applies `created-by: Contributor`.
- **Job `triage`** (`initial-triage`, runs only on `issues` event): checks out repo, invokes local composite action `./.github/actions/triage` with inputs: `reproduction-comment: '.github/comments/invalid-reproduction.md'`, `reproduction-link-section` regex matching the "Link to the code that reproduces this issue" form field, `reproduction-issue-labels: 'validate-reproduction'`, `actions-to-perform: 'tag,comment'`, `area-label-section` regex matching the "Which area(s) are affected?" form field, `area-label-skip: 'Not sure'`. This auto-tags issues lacking a valid reproduction link and auto-applies the parsed area labels.

### `stale.yml`
Triggers: nightly cron `0 6 * * *` (1am EST), plus manual `workflow_dispatch` with a `dry-run` boolean input.
- Uses `actions/stale@v10.2.0`.
- `days-before-stale: 30`, `days-before-close: -1` (closing is **disabled** — only labels, never auto-closes).
- `exempt-all-assignees: true`.
- Issues: applies label `stale`; exempt labels `prioritized,keep,created-by: Payload team,created-by: Contributor,status: verified`; empty stale message (no comment posted).
- PRs: applies label `stale`; exempt labels `prioritized,keep,created-by: Payload team,created-by: Contributor`; empty stale message.
- `operations-per-run: 300`, `ascending: true` (processes oldest first).

### `lock-issues.yml`
Triggers: nightly cron `0 5 * * *` (12am EST, staggered before stale), plus manual `workflow_dispatch`.
- Uses `dessant/lock-threads@v6.0.0`.
- `process-only: 'issues'` (PRs not locked by this workflow).
- `issue-inactive-days: '7'` — locks issues inactive 7+ days.
- `exclude-any-issue-labels: 'status: awaiting-reply'` — issues with that label are skipped.
- Posts a lock comment: "This issue has been automatically locked. Please open a new issue if this issue persists with any additional detail."

### `label-on-change.yml`
Triggers: `issues` event types `assigned, closed, labeled, reopened`.
- **`on-labeled-ensure-one-status`**: when a `status:` label is applied, removes all other `status:` labels from the issue (enforces single-status invariant).
- **`on-issue-close`**: removes all `status:*` labels and the `stale` label when an issue closes.
- **`on-issue-reopen`**: applies `status: needs-triage` on reopen.
- **`on-issue-assigned`**: removes `status: needs-triage` when an issue (that has that label) is assigned to someone.
- Two commented-out stub jobs (`on-pr-merge`, `on-pr-close`) exist but are disabled/unimplemented.

### `.github/comments/invalid-reproduction.md` (the auto-posted comment body, verbatim)
Source: `gh api repos/payloadcms/payload/contents/.github/comments/invalid-reproduction.md --jq '.content' | base64 -d`

```markdown
**Please add a reproduction in order for us to be able to investigate.**

Depending on the quality of reproduction steps, this issue may be closed if no reproduction is provided.

### Why was this issue marked with the `invalid-reproduction` label?

To be able to investigate, we need access to a reproduction to identify what triggered the issue. We prefer a link to a public GitHub repository created with `create-payload-app@latest -t blank` or a forked/branched version of this repository with tests added (more info in the [reproduction-guide](https://github.com/payloadcms/payload/blob/main/.github/reproduction-guide.md)).

To make sure the issue is resolved as quickly as possible, please make sure that the reproduction is as **minimal** as possible. This means that you should **remove unnecessary code, files, and dependencies** that do not contribute to the issue. Ensure your reproduction does not depend on secrets, 3rd party registries, private dependencies, or any other data that cannot be made public. Avoid a reproduction including a whole monorepo (unless relevant to the issue). The easier it is to reproduce the issue, the quicker we can help.

Please test your reproduction against the latest version of Payload to make sure your issue has not already been fixed.

### I added a link, why was it still marked?

Ensure the link is pointing to a codebase that is accessible (e.g. not a private repository). "[example.com](http://example.com/)", "n/a", "will add later", etc. are not acceptable links -- we need to see a public codebase. See the above section for accepted links.

### Useful Resources

- [Reproduction Guide](https://github.com/payloadcms/payload/blob/main/.github/reproduction-guide.md)
- [Contributing to Payload](https://www.youtube.com/watch?v=08Qa3ggR9rw)
```

### Other workflows present (not expanded, names only, from dir listing)
`activity-notifications.yml`, `ai-reviewer.yml`, `audit-dependencies-branch.yml`, `audit-dependencies.yml`, `dismiss-stale-community-approvals.yml`, `dispatch-event.yml`, `e2e.config.ts`, `int.config.ts`, `main.yml`, `notify-next-canary.yml`, `post-release-templates.yml`, `post-release.yml`, `pr-title.yml` (likely enforces conventional-commit PR titles per CONTRIBUTING.md), `publish-prerelease.yml`, `publish-release.yml`, `release-bump.yml`, `sync-mirror.yml`, plus `utilities/` dir and `wait-until-package-version.sh`.

---

## 8. GitHub Discussions

### Payload (`payloadcms/payload`)
Query: `gh api graphql -f query='{repository(owner:"payloadcms",name:"payload"){hasDiscussionsEnabled discussionCategories(first:20){nodes{name slug emoji isAnswerable description}}}}'` (2026-11-06)

`hasDiscussionsEnabled: true`

7 categories:
| Name | Slug | Emoji | Answerable | Description |
|---|---|---|---|---|
| Announcement | `announcement` | 📣 | false | (empty) |
| Feature Requests & Ideas | `feature-requests-ideas` | 💡 | false | "Submit and discuss Payload feature requests / enhancements here" |
| General | `general` | 💬 | false | "Chat about anything and everything here" |
| Polls | `polls` | 🗳️ | false | "Take a vote from the community" |
| Q&A | `q-a` | 🙏 | **true** | "Ask the community for help" |
| Roadmap | `roadmap` | #️⃣ | false | "For all features and additions that are included within Payload's public Roadmap." |
| Show and tell | `show-and-tell` | 🙌 | false | "Show off something you've made" |

This matches `config.yml`'s routing: feature requests → `feature-requests-ideas` category; questions → `q-a` (the only answerable category).

---

## 9. FUNDING.yml

`gh api repos/payloadcms/payload/contents/.github/FUNDING.yml` → **404 Not Found** (2026-11-06). No `FUNDING.yml` exists; the `.github` directory listing (10 items) confirms its absence — Payload does not use GitHub Sponsors button/funding links.

---

## 10. Community profile health

Source: `gh api repos/payloadcms/payload/community/profile` (2026-11-06)

- `health_percentage`: **75**
- `description`: "Payload is the open-source, fullstack Next.js framework, giving you instant backend superpowers. Get a full TypeScript backend and admin panel instantly. Use Payload as a headless CMS or for building powerful applications."
- `documentation`: `https://payloadcms.com`
- Files reported:
  - `code_of_conduct`: **null** (absent)
  - `code_of_conduct_file`: **null** (absent)
  - `contributing`: present → `CONTRIBUTING.md`
  - `issue_template`: **null** (the API's "canonical" issue_template slot is null — likely because Payload uses the multi-file `ISSUE_TEMPLATE/` *folder* with a `config.yml`, not a single flat `ISSUE_TEMPLATE.md`, which this field doesn't always detect)
  - `pull_request_template`: present → `.github/PULL_REQUEST_TEMPLATE.md`
  - (license and readme are also part of this endpoint's schema but were truncated from the captured excerpt; `SECURITY.md` presence is also tracked separately by this endpoint)

The missing Code of Conduct is the main contributor to the 75% (not 100%) health score, given `CONTRIBUTING.md`, `SECURITY.md`, `PULL_REQUEST_TEMPLATE.md`, and a license are all present.

---

## Contrast: strapi/strapi

### Labels
Command: `gh label list --repo strapi/strapi --limit 300 --json name,description,color` (2026-11-06)
**Total: 89 labels.** Dominant groups: `source:` (30 labels — one per internal package/plugin, e.g. `source: core:admin`, `source: plugin:graphql`, `source: core:database`), `flag:` (16 — PR/issue meta-flags like `flag: 💥 breaking change`, `flag: migration guide`, `flag: EE`, `flag: v3-unsupported`), `pr:` (6 — PR-type taxonomy: `fix`, `feature`, `chore`, `enhancement`, `doc`, `security`), `issue:` (5 — issue-type taxonomy: `bug`, `enhancement`, `feature request`, `discussion`, `security`), `status:` (5 — `confirmed`, `can not reproduce`, `duplicate`, `pending reproduction`, `will not fix`), `severity:` (4 — `critical/high/medium/low`), `version:` (2 — `4`, `5`), `scope:` (2). Notably richer per-package `source:` taxonomy than Payload's `area:`/`plugin:` mix, and an explicit `severity:` ladder Payload lacks entirely.

### Issue templates
Dir listing: `gh api repos/strapi/strapi/contents/.github/ISSUE_TEMPLATE` (2026-11-06) → 2 files: `BUG_REPORT.yml`, `config.yml`. (No separate feature-request template — feature requests are presumably routed elsewhere, similar to Payload's Discussions-only approach.)

### Discussions
`hasDiscussionsEnabled: true`. 16 categories (far more granular than Payload's 7), including framework-split support categories (`Frontend - React/Next.js`, `Frontend - Vue/Nuxt.js`, `Strapi Admin`, `Strapi Backend`, `Strapi Design System`), community-content categories (`Community Plugins`, `Community Providers`, `Community Guides`), governance (`RFCs`, `Announcements`), and even an AI-era category (`Agent Skills`, `Guides` described as "AI Engineering Practices for Strapi Developers").

---

## Contrast: sanity-io/sanity

### Labels
Command: `gh label list --repo sanity-io/sanity --limit 300 --json name,description,color` (2026-11-06)
**Total: 55 labels.** Much flatter/less-prefixed taxonomy than Payload or Strapi — mostly standalone tags rather than grouped namespaces: `ux`, `docs`, `good-first-issue`, `question`, `📦 deps`, `🤖 bot`, `repro-wanted`, `content-lake`, `improvement`, `needs-more-info`, `portable text`, `CLI`, `schema`, `codex`, release-train tags (`release:latest`, `release:v4`, `release:v5`, `next-release`), internal team/ticket-prefix tags (`CLDX`, `ENTX`, `SAPP`, `SRE`, `CRX` — look like internal Jira/Linear project codes), automation tags (`sieve:bug`, `sieve:triaged`, `Sieve-Agent` — an auto-triage bot), `✨ ai` ("PR authored by an AI agent"), `Spam`. No `area:`/`status:` namespace convention at all — Sanity's label system is much less formalized than Payload's or Strapi's.

### Issue templates
Dir listing: `gh api repos/sanity-io/sanity/contents/.github/ISSUE_TEMPLATE` (2026-11-06) → 2 files: `bug_report.md`, `feature_request.md` (both legacy Markdown-front-matter style, not the newer YAML issue-forms format Payload and Strapi use).

### Discussions
`hasDiscussionsEnabled: true`. 5 categories: `Announcements`, `Requests for comment (RFC)` (answerable), `Sanity Studio Feedback`, `Sanity Studio Support` (answerable), `Show and tell` — the smallest/simplest of the three, closest in size to Payload's 7.

---

## Summary table

| Repo | Labels | Issue template format | Discussions | Categories | FUNDING.yml | CODE_OF_CONDUCT.md |
|---|---|---|---|---|---|---|
| payloadcms/payload | 136 (incl. junk from form bugs) | YAML issue-forms + 1 md + config.yml (blank disabled) | ✅ | 7 | ❌ 404 | ❌ null |
| strapi/strapi | 89 | YAML issue-form + config.yml | ✅ | 16 | not checked (out of scope) | not checked |
| sanity-io/sanity | 55 | legacy `.md` templates (2) | ✅ | 5 | not checked (out of scope) | not checked |


---

## 4. Workflow status badges

- Badge URL: `https://github.com/OWNER/REPOSITORY/actions/workflows/WORKFLOW-FILE/badge.svg`; `?branch=` and `?event=` query parameters. "By default, badges display the status of your default branch. If there are no workflow runs on your default branch, it will display the status of the most recent run across all branches." (https://docs.github.com/en/actions/how-tos/monitor-workflows/add-a-status-badge, 2026-11-06)
- README media: images and GIFs up to 10MB; videos (`.mp4`, `.mov`, `.webm`) up to 10MB on a free plan, H.264 recommended. (https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files, 2026-11-06)
