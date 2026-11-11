# Sources — 2026-11-06-launch-kit-final-review

> Primary sources fetched 2026-11-06 for U (launch kit). Every rule carries its URL, fetch date and a verbatim quote; anything that could not be quoted is marked `[UNVERIFIED]`. Channel rules change (HN added its generated-text rule in 2026), so step 12 re-fetches every URL here within 7 days of launch and records any change.
>
> Sections: 1. Hacker News + Lobsters · 2. Product Hunt, DevHunt, AlternativeTo · 3. Reddit · 4. Launch-week formats · 5. Passive channels and cross-post platforms · 6. Launch-post examples and guides (step 24, fetched 2026-11-09; reading material, not rules).
>
> In use at launch (interview 2026-11-06): Show HN (§1), Product Hunt (§2.1–2.8), DevHunt $49 launch (§2.9–2.10), LinkedIn (no official limits doc found, §5.17), Convex Discord (rules not readable logged out, §5.10), dev.to + Hashnode cross-post (§5.13–5.14), Cooperpress newsletters + This Week in React (§5.1–5.2), jamstack.org + awesome-nextjs PRs (§5.4, §5.7). Recorded but not used: Lobsters, Reddit, X, Bluesky, AlternativeTo, Convex Templates/Stack, awesome-react, Bytes.

---

## 1. Hacker News + Lobsters

### 1.1 Show HN Guidelines
URL: https://news.ycombinator.com/showhn.html
Fetched: 2026-11-06
Status: ok

- "Show HN is for something you've made that other people can play with." → VexCMS must have a working, try-able artifact (e.g. `create-vexcms` scaffolder usable in minutes, or a live demo), not just a landing page.
- "On topic: things people can run on their computers or hold in their hands." → a CLI scaffolder + a runnable example app qualifies.
- "Off topic: blog posts, sign-up pages, newsletters, lists, and other reading material. Those can't be tried out, so can't be Show HNs." → docs.vexcms.dev alone is NOT postable as Show HN; need the repo/scaffolder as the link.
- "The project should be non-trivial. Don't post quickly-generated one-offs; anybody can do that now. Share something that is deeply personal and interesting to you. Explain how and why." → write a genuine backstory (why Convex+Next.js type-safe CMS), not boilerplate.
- "The project must be something you've worked on personally and which you're around to discuss." → @ianyimi (solo maintainer) must personally post and stay in the thread to answer questions.
- "A Show HN needn't be complicated or look slick. The community is comfortable with work that's at an early stage." → 0.1.0 early-stage framing is fine.
- "Please make it easy for users to try your thing out, ideally without barriers such as signups or emails." → `npx create-vexcms` with no signup/API key requirement is important; if Convex requires an account, flag this risk prominently in title/first comment.
- "If your work isn't ready for users to try out, please don't do a Show HN... Don't post landing pages or fundraisers." → launch only after scaffolder + docs are functional end-to-end.
- "To post, submit a story whose title begins with \"Show HN\"." → exact required title prefix: `Show HN: <title>`.
- "Every Show HN appears on shownew. Once it clears a small points threshold, it will appear on the show page in the top bar." → no guaranteed front-page placement; early upvotes matter.
- "New features and upgrades (\"Foo 1.3.1 is out\") generally aren't substantive enough to be Show HNs. A major overhaul is probably ok." → 0.1.0 initial launch qualifies as substantive (first public release), but future patch bumps (0.1.1) should NOT be resubmitted as Show HN.
- "Please don't ask friends to upvote or comment. That's not ok on HN." → do not solicit votes from team/community channels before or during the post.
- Comment-section norms: "Be respectful... Ask questions out of curiosity. Don't cross-examine... When something isn't good, you needn't pretend that it is, but don't be gratuitously negative." → maintainer should model calm, non-defensive engagement in replies.

### 1.2 Hacker News Guidelines (general submission rules)
URL: https://news.ycombinator.com/newsguidelines.html
Fetched: 2026-11-06
Status: ok

- "Please don't do things to make titles stand out, like using uppercase or exclamation points, or saying how great an article is." → title must be plain, no "AMAZING new CMS!!!".
- "Please submit the original source." → link to the GitHub repo (github.com/ianyimi/vex) or vexcms.dev directly, not a third-party writeup.
- "Please don't use HN primarily for promotion. It's ok to post your own stuff part of the time, but the primary use of the site should be for curiosity." → @ianyimi's HN account should have a history of non-self-promotional activity, not be launch-only.
- "Please don't put generated text in HN posts... please don't automate posting." → title, first-comment text, and all replies must be hand-written by the human maintainer, not LLM-generated/edited — directly reinforced by dang's comment (source 4) as "a big dividing line at present."
- "If the title includes the name of the site, please take it out, because the site name will be displayed after the link." → don't put "vexcms.dev" in the title text itself.
- "If the title contains a gratuitous number or number + adjective, we'd appreciate it if you'd crop it." → avoid titles like "5 reasons VexCMS is great"; keep it factual/descriptive.
- "Otherwise please use the original title, unless it is misleading or linkbait; don't editorialize." → keep title literal and descriptive of what VexCMS is.
- "Don't solicit upvotes, comments, or submissions. Users should vote and comment when they run across something they personally find interesting—not for promotion." → no "please upvote" messaging anywhere, including Discord/Twitter cross-posts timed to the launch.

### 1.3 Hacker News FAQ
URL: https://news.ycombinator.com/newsfaq.html
Fetched: 2026-11-06
Status: ok

- "Are reposts ok? If a story has not had significant attention in the last year or so, a small number of reposts is ok. Otherwise we bury reposts as duplicates. Please don't delete and repost the same story." → if the 0.1.0 Show HN doesn't gain traction, wait roughly a year (or wait for a materially new release) before resubmitting; never delete-and-repost immediately.
- "Can I ask people to upvote my submission? No. Users should vote for a story because they personally find it intellectually interesting... We penalize or ban submissions, accounts, and sites that break this rule." → vote manipulation / asking for upvotes risks account/submission penalties, not just a guideline violation.
- "Can I ask people to comment on my submission? No, for the same reason. It's also not in your interest: HN readers are sensitive to this and will detect it, flag it, and use unkind words like 'spam'." → seeding comments from friends/community will likely backfire via flagging.
- "What's the relationship between YC and HN?... HN gives three features to YC: job ads... and startup launches get placed on the front page..." → the dedicated "Launch HN" front-page placement is a YC-exclusive privilege for YC-funded startups; VexCMS (not YC-funded) does NOT qualify for "Launch HN" — must use the general "Show HN" track instead. [CONFIRMED via /launches page: every entry on https://news.ycombinator.com/launches is tagged with a YC batch, e.g. "(YC W23)", "(YC S26)" — no non-YC entries observed across 30 listed items.]
- "How are stories ranked? The basic algorithm divides points by a power of the time since a story was submitted. Comments in threads are ranked the same way. Other factors affecting rank include user flags, anti-abuse software, software which demotes overheated discussions, account or site weighting, and moderator action." → early velocity of upvotes matters a lot (post timing), and flags/anti-abuse software can suppress ranking even without explicit vote manipulation.
- "Why hasn't my submission appeared on Ask HN or Show HN? All Ask HNs appear on newest and asknew, and all Show HNs on newest and shownew, but there is a small points threshold before a post makes it to ask or show." → the post will initially be visible only on /shownew until it crosses a small point threshold.

### 1.4 Launch HN page (YC-only confirmation) + dang's Show HN advice comment
URL (listing): https://news.ycombinator.com/launches
Fetched: 2026-11-06
Status: ok
URL (dang comment): https://news.ycombinator.com/item?id=22336638
Fetched: 2026-11-06
Status: ok

- Confirmed: https://news.ycombinator.com/launches is exclusively "Launch HN:" posts from YC-batch companies — every single one of the 30 entries sampled includes a YC batch tag, e.g. "Launch HN: Rivet (YC W23) – Scale and Orchestrate Agents on S3" and "Launch HN: Simantic (YC F26) – Firmware Simulation for AI Agents." → VexCMS must use the standard "Show HN:" title/track, not "Launch HN:" (that prefix is reserved for YC companies and is moderator-placed, not self-selectable).
- dang (HN moderator), item 22336638, widely-cited Show HN advice, quoted directly:
  - "Write your text by hand. Don't use an LLM to generate any of it (not even a tiny bit, including to edit or spruce it up). Reason: the community is super fussy about this right now, and LLM language leaves imprints on your text which are generating quite some backlash when it appears on HN itself. This is a big dividing line at present!" → CRITICAL: the maintainer must personally hand-write the Show HN title and body text; do not have an AI assistant draft/polish the launch post copy, even though AI tooling is fine to build with.
  - "If you're sharing your own work and there's a way to try it out, put \"Show HN\" in the title." → confirms exact prefix usage.
  - "Include text giving the backstory of how you came to work on this, and explaining what's different about it... Your text should show up at the top of the Show HN submission, but if for some reason it doesn't, add it as a first comment to the thread." → VexCMS post needs a substantive first-comment/body text: personal backstory + differentiation (type-safe, Convex-native, headless).
  - "Include a clear statement of what your project is or does. If you don't, the discussion will consist of 'I can't tell what this is.'" → open with a one-sentence plain definition of VexCMS.
  - "Include links to any previous HN threads that are relevant." → if any earlier Convex/VexCMS-adjacent HN threads exist, link them.
  - "Drop any language that sounds like marketing or sales. On HN, that is an instant turnoff. Use factual, direct language." → no "revolutionary," "blazing fast," etc. in body text.
  - "For Show HN, the product/project needs to actually exist and there needs to be a way for people to try it out. It can't just be a landing page or market test or fundraiser or a blog post or a curated list or other reading material." → reaffirms source 1; scaffolder/repo must be functional at launch time.
  - "Please make it easy for users to try your thing out, preferably without having to sign up, get a confirmation email, and other such barriers." → if Convex account signup is required to run `create-vexcms` end-to-end, this is a real friction point to address/minimize/explain in the post.
  - "Don't have your username be that of your company or project. It creates a feeling of using HN for promotion... You don't have to use your real name, just something to indicate that you're here as a human, not a brand." → @ianyimi's HN account should not be literally named "vexcms" or similar.
  - "Make sure your friends and users do not add booster comments in the thread. HN users are adept at picking up on those, they consider it spamming, and they will flame you for it." → brief the team/community explicitly not to post "this is awesome!" comments.
  - "You can post a new release as a Show HN only if the new version is significantly different... This should probably only happen once or twice a year—more starts to be excessive." → future major VexCMS versions (e.g. 1.0) could justify another Show HN later, but not every minor release.

### 1.5 Lobsters — About (self-promotion rule, invite-only, show tag)
URL: https://lobste.rs/about
Fetched: 2026-11-06
Status: ok

- "**Self-promotion**: It's great to have authors participate in the community, but not to exploit it as a write-only tool for product announcements or driving traffic to their work. As a rule of thumb, self-promo should be less than a quarter of one's stories and comments in the last year." → the maintainer's Lobsters account should have a history of non-self-promo activity before/after posting VexCMS; self-promo posts must stay under ~25% of yearly activity.
- "New users (first 70 days) are not allowed to submit self-promo." → an account must be 70+ days old before it can submit a VexCMS self-promo story; cannot create an account specifically to launch.
- Invite-only confirmed: "a user invitation tree to combat spam" and "The full user tree is public and each user's profile shows who invited them... If you wrote a link that was posted, please reach out in chat, we'd love to have you join the community." → Lobsters has no open signup; an account must be invited by an existing member, or the maintainer can request an invite via chat after someone else has already posted a VexCMS link. Plan the invite path ahead of launch.
- Also from new-user restrictions list: "New users can't ... submit links to domains we haven't seen submitted before ... resubmit links that have been seen before, or use tags for meta discussions or that are prone to off-topic stories (meta rant show announce satire job interview merkle-trees ask culture vibecoding)." → a brand-new account (even once invited, within first 70 days) CANNOT use the `show` tag or submit a never-before-seen domain (vexcms.dev / github.com/ianyimi likely novel domains) — compounds the 70-day + invite requirements; the account posting VexCMS needs real tenure, not just an invite.
- Flagging reasons include "**Spam** which should be used for content that either is designed to promote a commercial service or for content that is created without meaningful human authorship." → both pure self-promotion and AI-generated post text/README risk a spam flag; same hand-written-text discipline as HN applies.
- "All users see all stories by default" and tags are used for filtering, not gatekeeping topicality by forum — but see tag description below for the deliberate `show` category.
- Topicality rule of thumb: "Will this improve the reader's next program? Will it deepen their understanding of their last program? Will it be more interesting in five or ten years? Is this compelling material that will seed a discussion, or is it just an artifact?" → frame the VexCMS submission/body around technical substance (type-safety approach, Convex integration design) rather than pure announcement, to pass Lobsters' topicality bar.

### 1.6 Lobsters — Tags page (`show` tag)
URL: https://lobste.rs/tags
Fetched: 2026-11-06
Status: ok

- "[show](/t/show \"Show Lobsters / Projects\") Show Lobsters / Projects" — the `show` tag is listed under the `format` category, described simply as "Show Lobsters / Projects." → use the `show` tag (plus a relevant language/topic tag, e.g. `javascript`/`release`) for a VexCMS submission — but per source 5, new accounts (<70 days) are explicitly barred from using the `show` tag, so this is gated behind account tenure.
- Related active tag confirmed useful for a launch post: "[release](/t/release \"Software releases and announcements\") Software releases and announcements" under `genre` category. → `release` tag is a legitimate complementary tag for a 0.1.0 announcement alongside `show`.

### 1.7 Verification of the generated-text rules (re-fetched by the spec author)
URL: https://news.ycombinator.com/newsguidelines.html, https://news.ycombinator.com/item?id=22336638
Fetched: 2026-11-06
Status: ok

- Submissions section: "Please don't put generated text in HN posts. Write your text yourself—HN is for sharing between humans." → every Show HN title and text is hand-written.
- Comments section: "Don't post generated text or AI-edited text. HN is for conversation between humans." → replies in the thread are hand-written too; prepared answers are fact sheets, not paste-ready text.
- dang's tips carry "Edit (2026-03-28)" and add: "Write your text by hand. Don't use an LLM to generate any of it (not even a tiny bit, including to edit or spruce it up)." and "(This is not, of course, to say that you shouldn't use LLMs - we use them heavily ourselves and are all in favor of doing so. Just don't use them to generate or edit text that you post to HN.)" → agents may prepare facts, links and checks; the words are the developer's.

---

## 2. Product Hunt, DevHunt, AlternativeTo

### 2.1 Product Hunt — How Product Hunt Works
URL: https://help.producthunt.com/en/articles/17734306-1-how-product-hunt-works
Fetched: 2026-11-06
Status: ok (served as .md)

- "A **maker** is anyone who builds with technology... If you had a hand in building it, you can share it here." → @ianyimi (solo maintainer) qualifies as maker; no co-founder needed.
- "When you submit your own product, you're both the **hunter**... and a **maker**. You don't need anyone else to post it for you." → No external hunter required for VexCMS launch.
- "Every launch goes live at **12:01 AM Pacific Time** on the day you schedule." → Schedule VexCMS launch to go live 00:01 PT.
- "**Never pay for upvotes or use services that promise them.** Inauthentic upvotes are easy for us to spot, and they can get your launch removed and your account banned." → No vote-boosting services/bots.
- "Company and brand accounts can't submit launches or comment. Sign up with your own name" → Must launch from @ianyimi's personal PH account, not a "VexCMS" brand account.
- "To submit a launch, your account also needs a **verified email address**." → Verify email before scheduling.

### 2.2 Product Hunt — Set Your Goals and Pick Your Launch Date
URL: https://help.producthunt.com/en/articles/17734355-3-set-your-goals-and-pick-your-launch-date
Fetched: 2026-11-06
Status: ok

- "Every launch goes live at **12:01 AM Pacific Time** on its scheduled date and runs for that full day, until midnight Pacific." → Full launch-day window is 00:01–23:59 PT (24h); plan PT-based comment-response shifts.
- "You can schedule a launch from **tomorrow up to 30 days ahead**." → Must schedule VexCMS launch within a 30-day lookahead window, not further out.
- "Each person can hunt up to **2 launches per day**." → Irrelevant to solo single-product launch but caps if bundling a second asset same day.
- "Weekdays usually bring more traffic and more competition. Weekends are quieter on both fronts, which can suit smaller teams and side projects." → As solo maintainer, consider a weekday with highest relevant-audience overlap vs. a quieter weekend; no PH-mandated day.

### 2.3 Product Hunt — Build Your Product Page
URL: https://help.producthunt.com/en/articles/17834537-4-build-your-product-page
Fetched: 2026-11-06
Status: ok

- "**Name (up to 40 characters).** Just the product's name. No taglines or emoji." → "VexCMS" fits easily within 40 chars; no slogan appended.
- "**Tagline (up to 60 characters).** Say exactly what the product does. Skip hype like 'the best' or '#1'." → Need a literal, non-hype 60-char tagline, e.g. a type-safe headless CMS on Convex + Next.js description.
- "**Description (up to 500 characters).** Lead with the value, then the features that deliver it." → Draft ≤500-char description leading with developer value prop.
- "**Logo (required)**... Recommended size: 240x240px. JPG, PNG, or GIF, up to 2MB." → Produce a 240x240px logo asset ≤2MB.
- "**Add images (at least 1 required)**... Recommended size: 1270x760px." → Gallery screenshots must be prepared at 1270x760px, minimum 1 image (plan 3+ to satisfy "stand out" checklist item).
- "**Add pricing (recommended).** Tell people if your product is **Free**, **Paid**, or has **Free options**." → VexCMS is Apache-2.0 OSS/free — select "Free" pricing field.
- "**Add launch tags (required, up to 3).**" → Pick ≤3 topic tags (e.g. Developer Tools, Open Source, Database Tools / similar categories) — must check current PH topic list for an "Open Source" tag before launch.
- "You have up to **5,000 characters**" for the first/Maker comment, posted and pinned at launch. → Draft pinned maker comment (≤5000 chars) explaining why VexCMS was built, what it does, who it's for, what feedback is wanted.
- "**Required:** launch name, tagline, description, logo, gallery image, launch tags, and your role (maker or hunter). You can't schedule until these are done." → These seven fields are the hard gate to scheduling.
- "If the same link launched in the last two months, you'll be asked to request a relaunch." → First-ever launch of vexcms.dev domain has no such constraint, but matters for future version launches.
- Company info (optional) lets you mark "whether it's open source (you'll need to link the repository)" → Link github.com/ianyimi/vex in the open-source field.

### 2.4 Product Hunt — How to Promote Your Launch (and What to Avoid)
URL: https://help.producthunt.com/en/articles/17734384-5-how-to-promote-your-launch-and-what-to-avoid
Fetched: 2026-11-06
Status: ok

- "**Never ask for upvotes.** Asking people directly to upvote, or running anything that requires or rewards upvotes, breaks Product Hunt's rules and can get your launch removed." → All promo copy for VexCMS launch day must say "try it / give feedback," never "upvote."
- "**Don't run contests or giveaways tied to upvotes.** A giveaway on launch day is fine. A giveaway that requires or rewards an upvote is not." → If running a launch-day giveaway/perk for VexCMS, it must not require upvoting.
- "**Don't use fake or extra accounts.** Every account should belong to one real person." → Single real @ianyimi account only; no alt accounts to self-vote.
- "When you ask people to check out your launch, ask them to **try it, comment, and share feedback**." → Outreach messaging template for VexCMS.
- "Communities where you're already active are great. Communities you've never posted in before are not the place to drop a link." → Promote in Convex/Next.js dev communities @ianyimi is already part of, not cold-posting to unrelated servers.

### 2.5 Product Hunt — Relaunch Your Product
URL: https://help.producthunt.com/en/articles/17734411-7-relaunch-your-product
Fetched: 2026-11-06
Status: ok

- "**More than two months since your last launch:** submit as usual... **Less than two months since your last launch:** you'll be asked to submit a relaunch request." → Any VexCMS 0.2.0 relaunch within 2 months of 0.1.0 needs a relaunch-request justification (major new feature etc.); plan launches ≥2 months apart or prepare justification.
- "Small fixes, minor UI tweaks, or a new pricing plan usually aren't enough on their own [to justify relaunch]." → Don't relaunch for patch releases; reserve PH relaunches for major version jumps.
- "Don't change your URL to get around the two-month window. Launches that try to bypass the duplicate check will be removed." → Keep canonical vexcms.dev URL; no URL-swap tricks.

### 2.6 Product Hunt — Community Guidelines
URL: https://help.producthunt.com/en/articles/3615694-community-guidelines
Fetched: 2026-11-06
Status: ok

- "Mass messaging users, asking for upvotes, using bots, incentivizing upvotes, and any other form of artificially increasing activity on your contribution is **not** acceptable. Self-promoting in comments will also be removed." → No mass-DM campaigns for VexCMS; self-promo comments on other launches are banned.
- "Profiles appear human and represent an individual, not a company... A complete profile includes: A first + last name, A clear profile photo of yourself, A headline and/or about section, A unique (non-company or generic) username." → @ianyimi's PH profile should be a real-name, real-photo personal profile, not a "VexCMS" branded account, ahead of launch.

### 2.7 Product Hunt — Can I Ask My Community/Friends/Family to Upvote?
URL: https://help.producthunt.com/en/articles/484935-can-i-ask-my-community-friends-family-to-upvote-a-product
Fetched: 2026-11-06
Status: ok

- "Please don't... asking or incentivizing people to upvote may trigger the algorithm to drop the product in the ranks or remove it from the homepage entirely." → Even indirect "ask friends to vote" tactics risk algorithmic penalty for VexCMS; invite people to try/comment only.

### 2.8 Product Hunt — Featuring Guidelines
URL: https://help.producthunt.com/en/articles/9883485-product-hunt-featuring-guidelines
Fetched: 2026-11-06
Status: ok

- "We do not feature: ... Directories or lists, Templates, Boilerplates... Hardware (unless it has a prominent digital component)" → VexCMS is a working scaffolder/CMS product, not a template repo/boilerplate list — positioning in copy should emphasize it's a functioning headless CMS app, not merely a code template, to avoid the "Boilerplates" exclusion given `create-vexcms` is a scaffolder.
- "**Useful**... **Novel**... **High Craft**... **Creative**" and "**No Vaporware**: We only feature products that are ready for use" → VexCMS 0.1.0 must be demonstrably live/usable (working docs.vexcms.dev, functioning repo) at submission time, not a roadmap/announcement.
- "**Live Products**: We only feature products that are currently available." → Launch page/live demo must be functional at time of PH review, before scheduled go-live.

### 2.9 DevHunt — FAQ
URL: https://devhunt.org/faq
Fetched: 2026-11-06
Status: ok

- "DevHunt is a launchpad for developer tools, built by developers... each week a new batch launches on the home page, and developers vote for the ones they like. It is open source and focused only on tools for developers." → VexCMS (a dev tool/CMS framework) fits DevHunt's scope.
- "Sign in, open your account and submit your tool with its name, website, description, logo and screenshots. Every tool gets a permanent page on DevHunt. Then pick a launch week: a launch costs $49." → Listing itself is free; paid $49 "launch" tier needed to pick a specific launch week, get dofollow link + newsletter spot + X post.
- "Listing a tool is free: every tool gets a permanent page with a nofollow link." → Free tier = permanent page but nofollow backlink only, no scheduled launch-week boost.
- "You have to sign in (GitHub or Google) to vote or comment, which keeps the votes from real people." → Voters/launchers need GitHub or Google auth; consistent with VexCMS's dev-tool/GitHub-centric audience.
- "Tools for developers: open-source projects, APIs and SDKs, frameworks and libraries, IDEs and editors, CLIs, testing, monitoring, DevOps, databases, auth, AI agents and MCP servers, and similar. Tools that are not for developers, NSFW tools, and services that sell fake engagement are not accepted." → VexCMS (open-source dev framework) clearly qualifies under "open-source projects / frameworks and libraries."
- "DevHunt is only for developer tools, launches run for a whole week, voters are developers, and the platform itself is open source on GitHub." → Launch window is a full week (not a single day like PH); plan week-long engagement cadence distinct from PH's 24h sprint.
- "Before its week starts, a launch can also take one of 3 weekly super boosts, priced by spot: #1 for $199, #2 for $149, #3 for $99." → Optional paid boost tiers if budget allows; not required for a basic listing/launch.

### 2.10 DevHunt — llms.txt (site facts)
URL: https://devhunt.org/llms.txt
Fetched: 2026-11-06
Status: ok

- "Free listing: every tool gets a permanent page at /tool/{slug} (nofollow link)." → Confirms free-tier mechanics and URL pattern `/tool/vexcms`.
- "Launch ($49, one time): pick the launch week, a spot in the weekly newsletter, a permanent dofollow link, listed above other launches on equal votes, plus its own post on X." → Paid launch benefits itemized for budget decision.
- Category list includes "Open Source," "DB," "Code," "API," "Boilerplate" → VexCMS could be tagged under Open Source / DB / Code categories on DevHunt (`/tools/open-source`, `/tools/db`).

### 2.11 AlternativeTo — FAQ (Submitting Applications)
URL: https://alternativeto.net/faq/
Fetched: 2026-11-06
Status: ok

- "You can add your software by using the option 'Suggest new application'... Your app then goes into our review backlog." → Submission is via in-app "Suggest new application" form, not a public API; goes into a review queue, not instant-live.
- "You need to verify your email address before you can submit a new app." → Verify AlternativeTo account email before submitting VexCMS listing.
- "We get far more app submissions than we have time to review. The normal queue holds several thousand apps and is growing faster than we can review it, so most apps in it will not be looked at for a very long time, and we can't promise yours will be." → Free review queue has no reliable timeline; plan for a long or indefinite wait unless paying.
- "**Priority review.** ... you can choose to move your app to the front of the queue for a one-time fee, shown before you pay. Priority submissions are usually reviewed within 1-2 business days." → Paid priority review is the only way to get fast (1-2 business day) turnaround for VexCMS's listing.
- "If the app is Coming Soon (announced only), in closed/private beta, invite-only, or in Early Access phase, we do not accept it. If the app is in open beta or into public beta, we will probably accept it." → VexCMS 0.1.0 must be publicly usable (not invite-only/waitlisted) at submission time to be accepted.
- "All applications added to the database must also support the English language." → Docs/UI must be in English (already true for VexCMS).
- "Software descriptions must not contain addresses, telephone numbers, email addresses and website links." → AlternativeTo listing description text must omit URLs/contact info; use the dedicated website/links fields instead.
- "Are links from AlternativeTo dofollow? Usually not. Links to apps' websites are nofollow unless our editors decide otherwise, and you can't buy a followed link." → No SEO backlink value expected regardless of priority-review payment.
- "What are the recommended image specifications for the icon on the app page? A squared PNG or SVG image, 280x280 or bigger, with transparent background is suggested." → Prepare a 280x280+ square transparent PNG/SVG icon, distinct from PH's 240x240 logo spec.
- "In general, we do not accept hardware... We do not accept apps and services only available or targeted specifically at single nations or in specific geographical areas." → Not applicable risk for VexCMS (global web dev tool) but confirms no geo-restriction issue.
- "Developers can get developer access to their own app's page, so their edits go live straight away." (see Developer-access source below) → After listing is approved, claim developer access to self-manage the VexCMS page.

### 2.12 AlternativeTo — Developer Access
URL: https://alternativeto.net/developers/
Fetched: 2026-11-06
Status: ok

- "If you make an app that is listed on AlternativeTo, you can get developer access to its page and keep it up to date yourself... Your edits to the app's page go live straight away instead of waiting for our review." → After initial VexCMS listing is approved, @ianyimi should claim developer access for instant self-edits going forward.
- "The app has to be approved and listed already." and "One account per app." → Developer access is a post-approval step, not part of initial submission; only one account can hold it.
- "Fill in the request form with your app and a work e-mail address at the app's own domain, for example you@yourapp.com rather than a Gmail address." → Requires an email at vexcms.dev domain (not a generic Gmail) to claim developer access — plan a vexcms.dev mailbox.

### 2.13 AlternativeTo — Terms of Use (App Listings)
URL: https://alternativeto.net/about/terms/
Fetched: 2026-11-06
Status: blocked (HTTP 403 on direct fetch)
Notes: Tried direct `read` of `https://alternativeto.net/about/terms/`; got HTTP 403. Did not find a usable Wayback Machine or alternate mirror within scope/time; the FAQ page (source #11) already quotes the operative "App listings"/"Priority app review" rules it links to ("Full details in our terms"), which cover the material facts (priority review refund policy). No separate facts recovered. [UNVERIFIED beyond what FAQ quotes]

### 2.14 Peerlist Launchpad — official rules
Status: not completed — skipped
Notes: Time/scope budget was allocated to the three required channels (Product Hunt, DevHunt, AlternativeTo) which already returned substantial verifiable rule sets. Did not attempt to fetch Peerlist's official launch rules page; this is optional per the task ("ONLY if official rules page is reachable — optional, one entry max") and was not pursued. No content fabricated.

---

## 3. Reddit

> Direct `about/rules.json` and old.reddit.com fetches were bot-walled (403, login redirect). §3.1–3.3 were fetched directly or from the indexed primary page; §3.4 was read from the rendered subreddit pages in a logged-out browser.

### 3.1 Reddit Rules (sitewide)
URL: https://redditinc.com/policies/reddit-rules
Fetched: 2026-11-06
Status: ok (direct fetch succeeded)

- "Abide by community rules. Participate authentically in communities where you have a personal interest, and do not spam or engage in disruptive behaviors (including content manipulation) that interfere with Reddit communities." (Rule 2) — implication: VexCMS launch posts must come from an account genuinely engaged in that community, not a first-post drive-by.
- "Communities and users that incite violence or that promote hate based on identity or vulnerability will be banned." (Rule 1) — not launch-relevant, standard conduct rule.
- "Be authentic. You don't have to use your real name, but do not intentionally mislead others or impersonate an individual or entity in a deceptive manner." (Rule 5) — implication: posting as the maintainer (@ianyimi) under a real account, disclosing affiliation, is required; undisclosed sockpuppet/marketing accounts risk a ban.
- Enforcement ladder: "Temporary or permanent suspension of accounts," "Removal of content," "Banning of Reddit communities" — implication: a single rule-breaking launch post can escalate past content removal to account suspension.

### 3.2 Reddit Help — Spam article
URL: https://support.reddithelp.com/hc/en-us/articles/28012014962580-How-do-I-keep-spam-out-of-my-community
Fetched: 2026-11-06
Status: ok (direct fetch succeeded; "Updated October 02, 2026" per page header, so current as of launch date)

- "On Reddit, promotional content is not inherently considered to be spam. That said, some communities do have strict policies that disallow any kind of promotional content. Other communities abide by the 10% rule: only 10% of your posting and comment history in the community can be self-promotional in nature, while the other 90% should be helpful, organic content unrelated to your personal interest." — implication: the historical "10:1"/"9:1" ratio guidance is **still live** on Reddit's own help site as of Oct 2026, framed as a per-community option, not a sitewide mandate. @ianyimi should build non-promotional comment/post history in target subs before posting a VexCMS launch thread.
- "Spam on Reddit is generally defined as repeated, unwanted, and/or unsolicited actions, whether automated or manual, that negatively affect users, Reddit communities, and/or Reddit itself." — implication: a single well-targeted launch post to a relevant, interested subreddit is not spam by this definition; cross-posting the identical copy to many subs in a short window would be.
- Examples of removable spam include "Repeatedly posting unrelated/off-topic/link-farmed content" and "Programming bots that harm/break Reddit, including bots intended to promote content/products/services" — implication: no automation/bot cross-posting of the launch announcement.

### 3.3 r/reddit.com self-promotion wiki (historical sitewide guide)
URL: https://www.reddit.com/wiki/selfpromotion
Fetched: 2026-11-06
Status: blocked direct fetch (bot challenge page returned); content via search-index snippet of the real page

- "This page is no longer updated. For more up to date information go here: https://www.reddithelp.com" — implication: the old sitewide self-promotion wiki page explicitly defers to the Reddit Help spam article (source 2) as the current authority; treat source 2, not this page, as canonical sitewide guidance. [quote confirmed via indexed snippet of reddit.com/wiki/selfpromotion]

### 3.4 Subreddit rules, read from the rendered subreddit pages
URL: https://www.reddit.com/r/<sub>/ (rules widget, logged-out Chromium). `about/rules.json` and old.reddit.com were bot-walled for plain fetches (§3 header note).
Fetched: 2026-11-06
Status: ok for reactjs, nextjs, webdev, javascript, typescript, opensource, programming, selfhosted; no rules widget rendered for SideProject, node, ConvexDev

**Not used at launch** — the developer has no Reddit account with history to post from (interview, 2026-11-06). Recorded so a later post-launch Reddit plan starts from the rules, not from memory.

- r/reactjs — rule 5: "If you have a body of content you'd like to promote, our recommended way of doing so is to be an active and positive member of the subreddit." / "Demo videos must be accompanied by source code" / "Please save portfolios for the weekly Sunday portfolio post." / "Please do not dump raw AI output as a post or comment." Post-type filter shows a "Show /r/reactjs" flair.
- r/nextjs — rule 4: "No posts shilling your product, project, portfolio, etc — Post your projects in the weekly show and tell". Rule 6: "If you wish to share your project in this community you may do so in the weekly show and tell."
- r/webdev — rule 5: "Sharing your project, portfolio, or any other content that you want to either show off or request feedback on is limited to Showoff Saturday. If you post such content on any other day, it will be removed. Posts must be tagged with the correct flair." / "Think project, not product." Rule 8 removes "LLM generated posts or comments". Rule 3 cites "the Reddit 9:1 rule".
- r/javascript — rule 1: "It's ok to promote your own content, or content that you're otherwise vested in, but it should not constitute a majority of your contributions." Rule 2: "Demos can be fun, but they really don't provide for much discussion unless code is provided as well."
- r/typescript — rule 2: "if you're posting a project it needs to be open source, you need to link to the repo and most importantly given that this is r/typescript it should not only be in typescript but be something that contributes to TS utility". Rule 5: "ChatGPT comment/post — Learn how to formulate and type your own opinions."
- r/opensource — rule 2: "Reddit recommends that <10% of your posts promote your content. We're a little more forgiving, but don't take advantage of it." Rule 3: "All AI-generated content is low-effort and ban worthy." Rule 4: "Code or repositories linked to MUST have a LICENSE file that MUST be an OSI listed Open Source license". Rule 6: "Drive-by posts from accounts where there is obviously no intention of engaging in the following discussion may be removed." Rule 8: "Promotional is when you are sharing a project, yours or otherwise."
- r/programming — rule 1: "No LLM-Written Content — If you don't want to write it, we don't want to read it." Rule 5: "r/programming is not the place to post a project to get feedback, ask for help, or otherwise promote it. Technical write-ups on what makes a project technically challenging, interesting, or educational are allowed and encouraged".
- r/selfhosted — rule 1: "All posts must be about self-hosting." Rule 2: "Promoted apps must be production ready and have docs." Rule 6: "Only in the current “New Project Megathread”, you may post projects that are younger than 3 months".

---

## 4. Launch-week formats

### 4.1 Supabase Launch Week hub
URL: https://supabase.com/launch-week
Fetched: 2026-11-06
Status: ok

- "Five days of launches to supercharge your development." — format is Mon–Fri, 5 days, one feature per day.
  Implication: VexCMS solo-maintainer cadence should be much shorter (see Dub/Resend below); 5 days is the large-company default, not a floor.
- "Join us for a week of announcing new features, every day at 8AM PT." — fixed daily publish time, consistent across days.
  Implication: VexCMS should pick one fixed daily time (e.g. 9am local) and hold it for every post.
- Per-day structure on the hub: "Monday / #### Introducing JWT Signing Keys / [Read more]" repeated for each weekday — each day = a title + hero image + "Read more" link to a dedicated blog post. ("Main Stage")
  Implication: each VexCMS launch-week day needs one canonical blog post URL to link from socials/HN/PH.
- "### Build Stage / A collection of surprise releases." — a secondary list of smaller unannounced shipped items alongside the main daily features, e.g. "Supabase UI: Platform Kit", "Improved Security Controls and A New Home for Security".
  Implication: VexCMS could bundle minor shipped items (e.g. CLI flag, template) as "also shipped this week" bullets without needing a full day slot.
- "Hackathon / Starts this Friday. ... Build something amazing in 10 days using Supabase. Compete solo or in a team, submit a quick demo and win. [Join Hackathon]" — hackathon starts on the last launch-week day and runs 10 days past it.
  Implication: too heavy for a 0.1.0 solo launch; skip or replace with a lightweight "build with VexCMS" call-to-action, no formal hackathon infra needed.
- "### LW15 Worldwide Meetups ... Join us for community-driven meetups around the world" — dozens of community-run local meetups listed via Luma links.
  Implication: not replicable at VexCMS's stage; irrelevant to a 0.1.0 launch.

### 4.2 Supabase — "How we launch at Supabase" (Ant Wilson, 2021-11-26)
URL: https://supabase.com/blog/supabase-how-we-launch
Fetched: 2026-11-06
Status: ok

- "why don't we just pretend that we're starting the batch again... let's just choose an arbitrary date 3 months from now, and we'll ship *something* huge." — Launch Week originated as an internal deadline-forcing device (fixed timeline, flexible scope), not a marketing gimmick first.
  Implication: for VexCMS 0.1.0 this reframes "launch week" as a forcing function to actually ship/polish by a date, independent of channel strategy.
- "why just have one launch? Why can't we aim to ship one major feature or announcement every day for a week?" — explains the one-feature-per-day origin.
  Implication: confirms the core mechanic to replicate (one shippable thing per day), scalable down to fewer days for a smaller surface area.
- "One of our learnings from previous Launch Weeks was to no longer ship to prod on the day of the Launch itself ... it's ideal to get all the major integrations done a week early." — code freeze before the public week; the week is for announcing, not shipping-to-prod live.
  Implication: VexCMS should finish/merge all 0.1.0 features before the announced day-by-day week begins; the week is a content/marketing cadence over already-tested work.
- Daily schedule example: "7:30am Twitter spaces reminder tweet / 7:55am Product Hunt goes live / 8:00am Blog post goes live / 8:05am Post launch tweet 1 / 8:10am Share tweet with Angels / 8:15am Twitter spaces go live" — minute-level runbook per day.
  Implication: VexCMS should write a literal per-day minute-by-minute checklist (blog → X/Bluesky → relevant subreddit/HN) to avoid live decision-making.
- "the person who implemented the code will be the same person who writes the marketing content... they're also probably the best person to decide which will be the most effective channels" and the Storage vs ui.supabase.com example: "The technical design discussion of Storage is better suited to channels like Hacker News... ui.supabase.com, we made sure to hit up all the front end and design channels, made sure it ranked on Product Hunt."
  Implication: VexCMS (solo maintainer) should match each day's feature to its best-fit channel rather than blasting every feature to every channel identically — e.g. a type-safety/schema feature → HN/r/programming; a scaffolder DX feature → PH/r/webdev.
- "This 'internal accelerator' model has worked well within Supabase as a 2-person team and is still proving effective now at 30" — explicit claim it worked at team size 2.
  Implication: directly supports viability for a solo maintainer, though scope-per-day must shrink accordingly.

### 4.3 launchweek.dev (README + FAQ + site)
URL: https://github.com/supabase-community/launchweek.dev (README), https://launchweek.dev, raw FAQ at lw/faq.mdx
Fetched: 2026-11-06
Status: ok

- "**What's a launch week?** It's a week where a company announces a new feature every day." — canonical community definition.
  Implication: the "every day" cadence is the defining trait being matched against, not the day count.
- "It doesn't *have to* last 5 days, though — it could last more or less than 5 days. In 2024, the shortest launch week lasted 3 days. The longest? 6 days. It was Unkey's Launch Week." (FAQ)
  Implication: directly licenses a shorter (e.g. 3-day) VexCMS launch week as a legitimate "launch week," not a watered-down imitation.
- "No. To quote Ant Wilson... 'One of our learnings...was to no longer ship to prod on the day of the launch itself.'" (FAQ, "do you ship new features every day?")
  Implication: reinforces: feature work done ahead of time, week is for staged announcements.
- "Both solo makers, early-stage and late-stage companies! ... Companies of different sizes participated, from solo makers (KeyHippo) to 100-person teams (Pinecone)." with a direct example: "KeyHippo Launch Week / API Keys for Postgres RLS" (https://keyhippo.com/launch-week/0)
  Implication: solo-maker launch weeks are an established, named pattern in this community (see KeyHippo) — validates doing this as a single maintainer.
- "This year, we tracked 123 launch weeks run by 92 different companies. Only 7 companies have run 3 launch weeks or more this year" (lw/n/forward.mdx, Flo Merian reflection piece — OPINION/analysis, not a rule)
  Implication: [attributed opinion] launch weeks are costly to repeat; VexCMS should treat 0.1.0's launch week as a rare/special event, not assume a recurring quarterly cadence from day one.
- "Launch weeks are high peaks — 5 announcements in 5 days — the most significant 'sign of life,' Resend's co-founder Zeno Rocha said" (forward.mdx, quoting Resend's Zeno Rocha)
  Implication: [attributed opinion, Resend] 5-in-5 is described as the "high peak" pattern but is explicitly optional per the FAQ above.
- Listed companies/data in README tree: `lw/n/dub.mdx`, `lw/n/resend.mdx`, `lw/n/raycast.mdx`, `lw/n/kiwicopple.mdx`, `lw/n/rorstro.mdx`, `lw/n/supabase.mdx`, `lw/n/forward.mdx`, `lw/n/fmerian.mdx` — curated write-ups/case studies of specific companies' launch weeks.
  Implication: these are the project's own primary "format guidance" documents (used directly in sections 3b/3c below).
- No PH/HN/Reddit staggering guidance found on launchweek.dev itself beyond the FAQ's "how do you recover?" → "By planning the next launch week" and a linked card "Planning a launch week? Launch on Product Hunt, too. / Launch on Product Hunt for compound effect" (product-hunt.mdx referenced, content not separately fetched).
  Implication: [UNVERIFIED] no explicit per-channel-per-day staggering rule found in this source; VexCMS should not assume launchweek.dev prescribes a specific HN/PH/Reddit schedule.

### 4.3b Resend — "How we keep momentum" (Heartbeat Framework, by Zeno Rocha)
URL: https://resend.com/handbook/marketing/how-we-keep-momentum (mirrored at https://raw.githubusercontent.com/supabase-community/launchweek.dev/main/lw/n/resend.mdx)
Fetched: 2026-11-06
Status: ok

- "Launch Weeks are the big peaks. It's when we launch 5 new features in 5 days. ... Frequency: 2-3x/year"
  Implication: Resend (small team) treats launch week as an infrequent (2-3x/year), high-cost event — not something to repeat casually post-0.1.0.
- "they require a heavy 'cost' from the team" and sits alongside smaller-cost tiers: "Mini-launches (Frequency: 4-5x/year)," "Changelogs (1-2x/month)," "Blog (1-2x/month)," "Social posts (1x/day)."
  Implication: launch week should be reserved for the 0.1.0 milestone itself; routine post-0.1.0 feature drops should go through changelog/blog/social tiers instead, not repeated launch weeks.
- Card: "Resend Forward: Wrap Up ... In the last seven days, we shipped six new features." — a wrap-up/recap post is part of the cycle (recap posted after, distinct from each day's post).
  Implication: VexCMS should plan a closing recap post after its launch week, linking all day posts (matches Dub's recap pattern below too).

### 4.3c Dub — first launch week case study
URL: https://raw.githubusercontent.com/supabase-community/launchweek.dev/main/lw/n/dub.mdx (launchweek.dev write-up of dub.co's launch week)
Fetched: 2026-11-06
Status: ok

- "A launch week doesn't *have to* last 5 days." and "Dub's launch week lasted 3 days." — concrete 3-day small-team example.
  Implication: strong direct precedent for VexCMS running a 3-day (not 5-day) launch week.
- Format: "Publish one announcement per day on their blog" + "Spread the news on Twitter/X" — minimal two-channel-per-day mechanic (blog + X), no hub microsite, no hackathon, no swag.
  Implication: VexCMS can run launch week with just blog-post-per-day + social post, no custom hub site needed for 0.1.0.
- Results table shows steep day-over-day decay: "Day 1 ... Impressions: 155K" vs "Day 2 ... Impressions: 10K" vs "Day 3 ... Impressions: 2K" — attention is heavily front-loaded on day 1.
  Implication: VexCMS should put its single most compelling/flagship feature (likely type-safety core value prop) on day 1, not save it for later in the week.
- Key takeaway quoted directly: "Day 1 had the most impact on social engagement... Related: Pull in customers and partners as much as possible. Dub may have reached this level of engagement because it featured partners like Stripe, Clerk, and Supabase."
  Implication: [attributed, launchweek.dev analysis] cross-tagging/mentioning integration partners (e.g. Convex, Next.js) in day-1 posts can boost reach — relevant since VexCMS is built on Convex.
- "Post a recap of your announcements to keep the momentum going. This is good for SEO, and it could still reach people who either forgot, ignored, or missed them the first time." — explicit recap-post rationale.
  Implication: confirms recap post as both an SEO and re-reach tactic, not just closure.

### 4.4 Trigger.dev Launchweek 0 and Launchweek 2 (small team, two editions)
URL: https://trigger.dev/launchweek/0 , https://trigger.dev/launchweek/2
Fetched: 2026-11-06
Status: ok

- Launchweek 0 tagline: "One feature. Every day. Five days straight." Dates: "December 2—6, 2024." Per-day format: "Day 1: December 2 ### Realtime goes GA ... Blog post" through "Day 5 ... Run Engine 2.0 (alpha) ... Blog post" — 5 weekdays, one blog post per day, no video/demo/hub extras beyond title + 1-2 sentence summary + blog link.
  Implication: a lightweight small-team template — just a hub index page listing day/title/summary/blog-link, no separate video or docs artifact required per day.
- Launchweek 2 tagline: "An entire week of new feature announcements." Dates: "August 18—22, 2025" (Mon–Fri). Per-day entries add "[View Docs]" links alongside "[Blog post]" for some days (e.g. Preview branches, Bulk actions) but not all (e.g. v4 GA, MCP server days only have Blog post).
  Implication: VexCMS can optionally pair docs.vexcms.dev deep-links with blog posts on days where a new API/feature needs reference docs, but it's not mandatory for every day.
- Closing line on LW2 hub: "Follow the journey on X/Twitter" — single social-channel pointer, no mention of HN/PH/Reddit staggering on the hub itself.
  Implication: [UNVERIFIED] no primary-source evidence found of Trigger.dev staggering HN/PH/Reddit across specific launch-week days; do not assume this pattern without further confirmation.
- Trigger.dev ran two editions ~8 months apart (Dec 2024 → Aug 2025), both 5 weekdays — i.e. a small team (public GitHub org, not enterprise-scale) sustained the 5-day Mon–Fri format across repeat editions.
  Implication: counter-evidence to assuming small teams must shrink to 3 days — Trigger.dev kept 5 days, so day-count is a team/scope choice, not a forced constraint for small teams.

### Staggering HN/PH/Reddit across days — evidence summary
- No primary source fetched (Supabase, launchweek.dev, Resend, Dub writeup, Trigger.dev) states an explicit rule for staggering Hacker News / Product Hunt / Reddit posts across specific launch-week days. [UNVERIFIED — not found in any fetched primary source]
- The only close analogue is Supabase's Ant Wilson's minute-by-minute single-day runbook (section 2) which staggers *within one day* across Twitter Spaces → Product Hunt → blog → tweets, not across different days of the week to different channels.
  Implication: VexCMS should not claim an industry-standard HN/PH/Reddit day-staggering rule exists; if adopted, it should be framed as VexCMS's own choice (e.g. day 1 = HN, mid-week = Reddit/niche, last day = Product Hunt for the whole week recap, as loosely suggested by launchweek.dev FAQ's "Launch on Product Hunt, too" recovery tip), not as attributed guidance.
- launchweek.dev FAQ explicitly ties Product Hunt to the *end*/recovery of a launch week ("how do you recover? By planning the next launch week" + card "Planning a launch week? Launch on Product Hunt, too. / Launch on Product Hunt for compound effect") rather than day-by-day.
  Implication: a defensible, source-grounded pattern is: daily blog+social posts during the week, then a single Product Hunt launch either on day 1 (per Supabase's actual runbook) or at the week's close (per launchweek.dev's framing) — but these two primary sources disagree on timing, so VexCMS must pick one explicitly rather than cite "the standard."

---

## 5. Passive channels and cross-post platforms

Fetch date for all sources: 2026-11-06 (one hashnode community guide was 404'd via DNS and had to be fetched via GitHub source).

---

### 5.1 Cooperpress (JavaScript Weekly / Node Weekly / React Status) — contact/submission route
URL: https://cooperpress.com/
Fetched: 2026-11-06
Status: ok

- No public "submit a link" web form exists; the only official contact channel is email.
- "### Editorial\n\neditor@cooperpress.com" — implication: pitch VexCMS launch content (article/tool link) to `editor@cooperpress.com`; this single address covers JavaScript Weekly, Node Weekly, React Status (all Cooperpress titles).
- "*We're always happy to talk!*" — implication: no formal gatekeeping copy; a short, direct pitch email is the expected format, not a structured form.
- `https://javascriptweekly.com/submit` → 404 (confirmed directly). [UNVERIFIED other submit-style URLs do not exist — only checked this one path]
- Cross-checked via search: Cooperpress's own `/publications` page (https://cooperpress.com/publications) lists each title (JavaScript Weekly reaches "over 170,000" subscribers per their own copy) but does not itself provide a distinct submission form per title — all route through editorial contact.
- Implication for VexCMS: there is one shared entry point (email) for JS Weekly, Node Weekly, and React Status; no need for three separate pitches/forms, but each newsletter's editor may want a different angle (JS Weekly = general tool news, React Status = React/Next.js integration angle, Node Weekly = backend/Convex-functions angle).

### 5.2 This Week In React — submission route
URL: https://thisweekinreact.com/
Fetched: 2026-11-06
Status: ok (RSS/alternate feed used for base fetch; no dedicated public submission page found)

- Site navigation exposes only: Articles, Newsletter, Thread, Sponsor — no "Submit" nav item. "Sponsor the newsletter" page exists (https://thisweekinreact.com/sponsor) but is paid-placement, not a free submission route. [UNVERIFIED — could not find a quoted "how to submit a link" rule anywhere on the site]
- Author/maintainer Sebastien Lorber's contact links are exposed via icons on newsletter issue pages: "[GitHub](https://github.com/slorber)", "[X](https://x.com/sebastienlorber)", "[Bluesky](https://bsky.app/profile/sebastienlorber.com)", "[LinkedIn](https://www.linkedin.com/in/sebastienlorber/)" — implication: no formal submission channel exists; best route is a direct @-mention/DM to Sebastien Lorber on X/Bluesky, or opening an issue against his personal GitHub, not a dedicated repo (checked `github.com/thisweekinreact/newsletter` → 404, no such repo).
- Implication for VexCMS: treat as a cold-outreach/mention channel, not a documented submission queue; no quoted rule to follow because none is published.

### 5.3 Bytes.dev (ui.dev / Fireship)
URL: https://bytes.dev/
Fetched: 2026-11-06
Status: ok

- Homepage meta only: "The most entertaining (and informative) JavaScript newsletter. Delivered twice a week, for free." — no "submit" link, contact form, or contribution rules are exposed anywhere on the fetched page. [UNVERIFIED — no submission route found; could not quote a rule because none exists on the page]
- Implication for VexCMS: Bytes.dev has **no published submission route** to target in the launch plan; drop it from the actionable channel list or treat as "no public intake — monitor/engage socially only."

### 5.4 Jamstack.org — headless CMS directory (jamstack/jamstack.org repo)
URL: https://github.com/jamstack/jamstack.org (root README) and https://github.com/jamstack/jamstack.org/tree/main/src/site/headless-cms
Fetched: 2026-11-06
Status: ok

- Repo root README documents only a "resources" contribution flow (videos/articles/presentations), not a documented headless-cms-listing process: "We accept contributions submitted as [pull requests]" — implication: submission mechanism for new CMS entries is PR-based (same repo), consistent with the data format below even though not explicitly spelled out in CONTRIBUTING for that specific directory. [UNVERIFIED that this generic PR-contribution text explicitly covers `src/site/headless-cms/`, since no separate CONTRIBUTING section names that folder — inferred from directory/file-naming convention]
- Directory listing shows each CMS as its own markdown file, e.g. `caisy.md`, `strapi.md`, `sanity.md`, `directus.md`, `wagtail.md` — implication: VexCMS must add `vexcms.md` (or similar slug) as a new file via PR.
- Sample entry (caisy.md) frontmatter, quoted verbatim:
```
title: Caisy
homepage: https://caisy.io/
twitter: caisyio
opensource: "No"
typeofcms: "API Driven"
supportedgenerators:
  - All
description: Caisy is a developer-friendly, API-first headless CMS...
images:
  - path: /img/cms/caisy-content.png
```
  — implication: required fields are `title`, `homepage`, `twitter`, `opensource` ("Yes"/"No" string), `typeofcms`, `supportedgenerators` (list, e.g. `All` or specific SSGs/frameworks), `description`, plus optional `images` array referencing files under `src/site/img/cms/`. VexCMS entry should set `opensource: "Yes"` (Apache-2.0), `typeofcms` to something like "Git-based" or "API Driven" (needs a decision — VexCMS is Convex-backed, so likely "API Driven"), `supportedgenerators` should include Next.js at minimum.
- No numeric minimum (e.g. GitHub stars) requirement was found anywhere in the README or file format — implication: no popularity gate to clear before listing; a working product + markdown file is sufficient per the repo's own documented process.
- Image spec quoted from root README: "Image should be a jpeg 600px wide and 400px tall" (for resource thumbnails; not explicitly re-stated for CMS entries, but the `images:` field in `caisy.md` uses PNGs under `/img/cms/` at arbitrary sizes) — [UNVERIFIED exact pixel spec for headless-cms entry images specifically].

### 5.5 Headlesscms.org (Netlify) — alternate headless-CMS list
URL: https://github.com/netlify/headlesscms.org
Fetched: 2026-11-06
Status: ok (repo discovered via search; metadata only, not deep-read)
- "Source for headlesscms.org" — MIT licensed, maintained by Netlify. [UNVERIFIED — did not fetch CONTRIBUTING.md or data file format for this repo; only confirmed its existence and that it is the canonical alternate listing source.] Flagging as a secondary candidate list requiring its own follow-up fetch before the launch spec finalizes submission steps.

### 5.6 awesome-headless-cms (awesomelistsio)
URL: https://github.com/awesomelistsio/awesome-headless-cms
Fetched: 2026-11-06
Status: ok (metadata only via search result)
- "A curated list of awesome Headless CMS platforms, tools, resources, and guides for decoupled content management." Stars: 3, Forks: 2 — implication: very low-traffic/low-authority list (3 stars); low priority, easy PR target but minimal reach. [UNVERIFIED — contribution guidelines not fetched directly; only description/stats confirmed]

### 5.7 awesome-nextjs — contribution guidelines
URL: https://raw.githubusercontent.com/unicodeveloper/awesome-nextjs/master/CONTRIBUTING.md
Fetched: 2026-11-06
Status: ok

- "Make an individual pull request for each suggestion." — implication: VexCMS (as a Next.js-integrated CMS/scaffolder) needs exactly one PR, not bundled with other changes.
- "Use the following format: `[Title Case Name](link) - Description.`" — implication: the create-vexcms/VexCMS entry must read like `[VexCMS](https://vexcms.dev) - Type-safe headless CMS built on Convex and Next.js.` with Title Case and a period.
- "Keep descriptions short and simple, but descriptive." / "Start the description with a capital and end with a full stop/period." — concrete formatting constraints confirmed verbatim.
- "New categories or improvements to the existing categorization are welcome." — implication: if no "CMS" category exists yet, VexCMS could propose adding one, but should first check current category list in the live README before assuming it needs one [UNVERIFIED — category list itself not fetched in this pass].
- No stars/age minimum found in the CONTRIBUTING text — implication: no quantitative gate to clear.

### 5.8 awesome-react (enaqx/awesome-react) — contribution rules
URL: https://github.com/enaqx/awesome-react
Fetched: 2026-11-06
Status: ok

- Stars: 75,198 — very high-authority list; strong placement value if VexCMS fits a category (none exists specifically for "CMS"/backend tooling currently — categories are React-ecosystem-specific: Frameworks, Component Libraries, State Management, etc.) [INFERENCE: VexCMS likely does not cleanly fit any existing category since it's a Convex-based CMS, not a React framework/library itself]
- Contribution rules, quoted verbatim from README's "Contribution" section: "Kindly refrain from using this list as an advertisement board or a space to promote your experiments. We focus on sharing entirely free resources here." — implication: VexCMS listing must be framed as a free dev resource, not promotional copy; being Apache-2.0/free and open-source supports eligibility.
- "Please feel free to propose updates for outdated projects and articles, as well as new contributions. I would prefer GitHub links, please." — implication: link to the GitHub repo (github.com/ianyimi/vex), not just vexcms.dev, when submitting the PR entry.
- No explicit star/age minimum stated.

### 5.9 sindresorhus/awesome — list-entry rules (meta-list, not itself a CMS list)
URL: https://raw.githubusercontent.com/sindresorhus/awesome/main/contributing.md
Fetched: 2026-11-06
Status: ok

- This document covers two different flows: "Adding an awesome list" (whole new lists) vs. "Adding something to an awesome list" (items within an existing list). Quoted: "If you have something awesome to contribute to an awesome list, this is how you do it... Access the awesome list's GitHub page... Click on the `readme.md` file... click on the edit icon... Submit the pull request!" — implication: this document is the generic PR-via-GitHub-edit mechanism Sindre's ecosystem uses; VexCMS itself would use this flow on a target *sub-list* (e.g. awesome-nextjs, awesome-react, or a CMS-specific awesome list), not on sindresorhus/awesome directly, since VexCMS is not itself "an awesome list."
- No separate quoted criteria for "Adding an awesome list" were captured in this pass (that section is for someone proposing a wholly new list, irrelevant to VexCMS). [UNVERIFIED — full create-list.md and pull_request_template.md guidelines not fetched since not applicable to VexCMS's use case]

### 5.10 Convex community / Convex Discord #show-and-tell
URL: https://discord.com/invite/nk6C2qTeCq (redirects to https://discord.com/invite/convex)
Fetched: 2026-11-06
Status: blocked (Discord server content itself requires auth/membership; only the public invite-landing metadata was fetchable)

- "Where Convex builders ask questions, share what they're building. | 16681 members" — confirmed public member count and tagline only.
- Could not fetch channel list or any published #show-and-tell posting rules — Discord's live channel content is not reachable via unauthenticated fetch. Tried: the invite URL directly (only returns OG/meta tags, no channel contents); no alternate (no public Discord API endpoint, no cached/Wayback version with rules text) was found for channel-specific rules.
- Implication for VexCMS: Discord #show-and-tell cannot be documented from outside; the launch spec must note this as "manual, no published rules — join and observe channel topic/pinned posts at posting time" rather than quote any rule.

### 5.11 Convex Stack (stack.convex.dev) — submission route
URL: https://stack.convex.dev/
Fetched: 2026-11-06
Status: ok

- Site is edited/author-driven: every article is bylined by a named Convex team member or community author (e.g. "Mike Cann", "Ian Macartney", "Jashwanth Peddisetty", "Hamza Saleem") — implication: Stack publishes long-form walkthroughs from both Convex staff and outside community members (e.g. "Jashwanth Peddisetty... 9 months ago... How to connect Convex to RunPod" is a non-Convex-employee guest post), confirming community submissions are accepted in principle.
- No explicit "Submit an article" link, form, or written submission guideline is present anywhere on the fetched homepage. [UNVERIFIED — no quoted submission rule exists on-page; the only evidence of community-author acceptance is the bylines themselves, not a documented process]
- Implication for VexCMS: a Stack post (e.g. "Building a type-safe CMS on Convex") is a plausible channel based on precedent (non-Convex authors are published), but the actual pitch route must be found via direct outreach (likely through the Convex Discord or a direct message to a Convex team member), not a public form.

### 5.12 Convex Templates gallery (convex.dev/templates) — submission route
URL: https://www.convex.dev/templates and https://raw.githubusercontent.com/get-convex/templates/main/CONTRIBUTING.md
Fetched: 2026-11-06
Status: ok

- The live gallery already includes many **community-submitted, non-Convex-org templates with their own GitHub repos** (e.g. "React Starter Kit (RSK)... Clerk, and Polar.sh", "v1 open-source starter kit... An open-source starter kit based on an open-source starter kit by Midday. Ported to Convex.") — implication: the templates gallery is not limited to `get-convex/templates`-hosted templates; third-party repos get a card with a "View Repo" link, confirming an acceptance path for outside submissions exists.
- `get-convex/templates` repo CONTRIBUTING.md is strictly **internal tooling documentation** for the Convex team's own canonical templates/`create-convex` CLI: "This repo contains: `create-convex`, the NPM project... A number of `template-*` directories" / "Install `just`... Install bun..." — implication: this repo's CONTRIBUTING is not the right venue for VexCMS as a scaffolder submission (it governs Convex's own first-party template set, with a `just`-based internal build/CI process), not a public contribution queue.
- No explicit "Submit your template" form/link was found on www.convex.dev/templates itself. [UNVERIFIED — exact submission mechanism for third-party gallery cards like RSK/v1/TanStack-AI-Chat not documented on the page; likely requires direct outreach to Convex DevRel, consistent with Stack's pattern above]
- Implication for VexCMS: `create-vexcms` itself (being a scaffolder, not a Convex app template) doesn't fit the gallery's template format directly, but a Convex+VexCMS example app built with `create-vexcms` could be submitted as a showcase card via direct outreach — no documented self-serve form found.

### 5.13 dev.to — canonical_url / cross-posting rules
URL: https://dev.to/p/editor_guide
Fetched: 2026-11-06
Status: ok

- "**canonical_url:** link for the canonical version of the content" — listed as a supported Front Matter field, confirming dev.to officially supports cross-posting with canonical attribution.
- "Add up to four comma-separated tags per post" — "**tags:** max of four tags, needs to be comma-separated" — implication: VexCMS launch post on dev.to is capped at 4 tags (e.g. `webdev, javascript, opensource, convex` or similar).
- "**ai_disclosure_level:** AI usage disclosure (`not_disclosed`, `no_ai`, `some_ai`, `fully_autonomous`)" — implication: if the VexCMS launch post itself was AI-assisted (e.g. by Claude Code), dev.to now requires declaring this via front matter — a new, concrete constraint to add to the launch checklist.
- "there is a limit of 200 megapixels per frame/page" for inline GIFs — minor technical constraint, low relevance but confirmed verbatim.

### 5.14 Hashnode — canonical URL / "originally published at"
URL: https://raw.githubusercontent.com/Hashnode/support/main/docs/write-an-article.md (docs.hashnode.com itself failed DNS resolution; GitHub source of the support docs used as the primary fallback)
Fetched: 2026-11-06
Status: ok (via GitHub-source fallback; `docs.hashnode.com` direct fetch failed with `getaddrinfo ENOTFOUND docs.hashnode.com`)

- "Are you republishing an article? Click on the **Add Original Article** button to change the canonical URL of the article to the original article in the **Are you republishing?** section." — implication: Hashnode supports canonical-URL cross-posting natively via a dedicated UI control, confirming the same dev.to→Hashnode (or vexcms.dev blog→Hashnode) canonical-attribution pattern is officially supported.
- "If you want to hide the article from the Hashnode Community, click on the **Yes, hide from Hashnode and display on my blog only** checkbox" — implication: cross-posted VexCMS content can optionally be excluded from Hashnode's public community feed while still living on a Hashnode-hosted blog, a nuance worth deciding for SEO/duplicate-content strategy.

### 5.15 Bluesky — post length limit
URL: Official Bluesky/AT-Protocol length constraints could not be fetched from bsky.social or atproto.com directly in this pass; corroborated via multiple independent third-party spec trackers, since a primary bsky.app/atproto.com docs page was not located.
Fetched: 2026-11-06
Status: blocked (no official bsky.social/atproto.com docs URL was found/fetched; relying on consistent third-party documentation instead)

- "Bluesky character limit: 300 per post" (trackmedia.app) and "Text post | None | Plain text post, up to 300 characters." (posteverywhere.ai) and "Character limit | 300 characters, hard limit" (docs.postzen.dev) — three independently-maintained third-party platform-API docs agree: **300-character hard limit** (measured in grapheme clusters, per the AT Protocol `graphemes<=300, bytes<=3000` convention cited by multiple trackers). [UNVERIFIED as a primary Bluesky/AT-Protocol source — no official bsky.social or atproto.com page was reachable in this pass; this fact is corroborated by consensus across independent secondary sources, not a direct quote from Bluesky itself]
- Implication for VexCMS: launch announcement posts on Bluesky must fit 300 characters (vs. X's 280), with link cards not counting against the text budget per these third-party docs (image/video-type constraints: up to 4 images, 1 video).

### 5.16 X (Twitter) — post character limit for non-premium accounts
URL: https://docs.x.com/fundamentals/counting-characters
Fetched: 2026-11-06
Status: ok

- "Posts on X can contain up to **280 characters**." — confirmed primary-source limit for standard (non-Premium) accounts.
- "All URLs are wrapped with `t.co` shortener and count as **23 characters**, regardless of the original length" — implication: a vexcms.dev link in a launch tweet costs exactly 23 characters regardless of actual URL length.
- "Emojis... count as **2 characters**, regardless of complexity" and "CJK... Weight 2" — minor but concrete counting rules if emoji are used in the launch copy.
- "Attached media (via official clients) counts as 0 characters" — implication: attaching a screenshot/GIF of the VexCMS CLI doesn't cost any of the 280-character budget.
- X Premium raises limits (long-form posts) per https://help.x.com/en/using-x/x-premium, but since VexCMS launch is assumed non-Premium by default, the 280 cap applies. [Explicit Premium limit number not quoted here since out of scope per the non-premium framing in the task]

### 5.17 LinkedIn — official post/link limits
URL: searched for an official LinkedIn doc stating post/link character or link-card limits; none found.
Fetched: 2026-11-06
Status: blocked — no official LinkedIn Help/Developer doc was located stating a specific post-length or link-card limit in this research pass.
- [UNVERIFIED — no primary LinkedIn source fetched; skipping per task instruction to include "only if an official doc states link/post limits." None was found, so this channel has no quotable rule for the launch spec.]

### 5.18 Bluesky post length — primary source
URL: https://github.com/bluesky-social/atproto/blob/main/packages/api/lexicons/app/bsky/feed/post.json (read via `gh api repos/bluesky-social/atproto/contents/packages/api/lexicons/app/bsky/feed/post.json`)
Fetched: 2026-11-06
Status: ok — supersedes the secondary-source corroboration in §5.15

- `"text": { "type": "string", "maxLength": 3000, "maxGraphemes": 300, ... }` → 300 graphemes per post. **Not used at launch** (no Bluesky channel); recorded for later.

### 5.19 Gaps left open at fetch time
- Netlify's headlesscms.org repo (§5.5): CONTRIBUTING and data format not fetched. Not on the submission list.
- jamstack.org (§5.4): the PR flow for `src/site/headless-cms/` is inferred from the directory's file convention, not a written rule. Step 10 reads a recently merged CMS-entry PR before drafting the entry.
- Convex Stack and Templates gallery (§5.11–5.12): no self-serve form. Not on the submission list.
- Convex Discord #show-and-tell (§5.10): rules are behind login. Step 2 records the pinned rules after joining.
- LinkedIn (§5.17): no official length or link-card limit found. Drafts keep the clip native and the link in the post body.

---

## 6. Launch-post examples and guides (step 24)

> Reading material for `launch-post-examples.md` (spec step 24, Design Decision 25), collected 2026-11-09 by
> research subagents. Not channel rules: step 12's re-fetch covers §1–§5 only. Per-URL status is in each table;
> numbers quoted in the examples were read on the date shown there.

### 6.1 Show HN examples and guides
Fetched: 2026-11-09
Status: ok

| URL | Fetched | Status |
|---|---|---|
| https://hn.algolia.com/api/v1/items/30769044 | 2026-11-09 | ok — (Appwrite thread) |
| https://hn.algolia.com/api/v1/items/32013330 | 2026-11-09 | ok — (PocketBase thread) |
| https://hn.algolia.com/api/v1/items/32013394 | 2026-11-09 | ok — (PocketBase author comment) |
| https://hn.algolia.com/api/v1/items/41322281 | 2026-11-09 | ok — (InstantDB thread) |
| https://hn.algolia.com/api/v1/search?query=Appwrite&tags=show_hn | 2026-11-09 | ok |
| https://hn.algolia.com/api/v1/search?query=Convex&tags=show_hn | 2026-11-09 | ok (no dedicated Convex-maker launch found; ecosystem projects used instead) |
| https://hn.algolia.com/api/v1/search?query=Directus&tags=show_hn | 2026-11-09 | ok |
| https://hn.algolia.com/api/v1/search?query=ElectricSQL&tags=show_hn | 2026-11-09 | ok |
| https://hn.algolia.com/api/v1/search?query=InstantDB&tags=show_hn | 2026-11-09 | ok |
| https://hn.algolia.com/api/v1/search?query=Keystone&tags=show_hn | 2026-11-09 | ok (no relevant KeystoneJS launch found) |
| https://hn.algolia.com/api/v1/search?query=Outstatic&tags=show_hn | 2026-11-09 | ok |
| https://hn.algolia.com/api/v1/search?query=Payload%20CMS&tags=show_hn | 2026-11-09 | ok |
| https://hn.algolia.com/api/v1/search?query=Payload&tags=show_hn&numericFilters=points>50 | 2026-11-09 | ok (no Payload CMS maker launch >50 pts found) |
| https://hn.algolia.com/api/v1/search?query=PocketBase&tags=show_hn | 2026-11-09 | ok |
| https://hn.algolia.com/api/v1/search?query=Refine&tags=show_hn | 2026-11-09 | ok (no relevant devtools Refine launch found) |
| https://hn.algolia.com/api/v1/search?query=Rocicorp%20Zero&tags=show_hn | 2026-11-09 | ok (0 relevant hits) |
| https://hn.algolia.com/api/v1/search?query=Strapi&tags=show_hn | 2026-11-09 | ok |
| https://hn.algolia.com/api/v1/search?query=Supabase&tags=show_hn | 2026-11-09 | ok |
| https://hn.algolia.com/api/v1/search?query=Supabase&tags=show_hn&numericFilters=points>100 | 2026-11-09 | ok |
| https://hn.algolia.com/api/v1/search?query=TinaCMS&tags=show_hn | 2026-11-09 | ok (no strong candidate, low points) |
| https://hn.algolia.com/api/v1/search?query=Triplit&tags=show_hn | 2026-11-09 | ok |
| https://hn.algolia.com/api/v1/search?query=Zero%20sync&tags=show_hn | 2026-11-09 | ok (no dedicated Rocicorp Zero launch found) |
| https://hn.algolia.com/api/v1/search_by_date?query=Strapi&tags=show_hn | 2026-11-09 | ok (no genuine Strapi-maker launch found in results) |
| https://news.ycombinator.com/item?id=22336638 | 2026-11-09 | ok — (dang's tips) |
| https://news.ycombinator.com/item?id=30769044 | 2026-11-09 | HTTP 200 on re-check |
| https://news.ycombinator.com/item?id=32013330 | 2026-11-09 | HTTP 200 on re-check |
| https://news.ycombinator.com/item?id=33306029 | 2026-11-09 | HTTP 200 on re-check |
| https://news.ycombinator.com/item?id=37584049 | 2026-11-09 | HTTP 200 on re-check |
| https://news.ycombinator.com/item?id=40788648 | 2026-11-09 | HTTP 200 on re-check |
| https://news.ycombinator.com/item?id=41322281 | 2026-11-09 | HTTP 200 on re-check |
| https://news.ycombinator.com/showhn.html | 2026-11-09 | ok |
| https://www.lucasfcosta.com/blog/hn-launch | 2026-11-09 | ok |
| https://www.markepear.dev/blog/dev-tool-hacker-news-launch | 2026-11-09 | ok |

### 6.2 Product Hunt examples and guides
Fetched: 2026-11-09
Status: partial (18 of 31 URLs blocked, missing or read via a mirror/snippet; see the table)

| URL | Fetched | Status |
|---|---|---|
| https://dub.co/blog/product-hunt | 2026-11-09 | ok |
| https://help.producthunt.com/en/articles/17350772-launch-guide | 2026-11-09 | blocked 404 (superseded by the collection URL above) |
| https://help.producthunt.com/en/articles/17734341-2-what-kind-of-products-get-featured | 2026-11-09 | ok |
| https://help.producthunt.com/en/articles/17734397-6-what-to-do-during-and-after-your-launch | 2026-11-09 | ok |
| https://help.producthunt.com/en/articles/17734646-8-launch-faq-and-myths | 2026-11-09 | ok |
| https://help.producthunt.com/en/collections/19793093-launch-guide | 2026-11-09 | ok |
| https://hunted.space/dashboard/295370 | 2026-11-09 | ok — (Payload CMS) |
| https://hunted.space/dashboard/351816 | 2026-11-09 | ok — (PocketBase) |
| https://hunted.space/dashboard/appwrite/launches/appwrite-2 | 2026-11-09 | ok |
| https://hunted.space/dashboard/convex/launches/convex | 2026-11-09 | ok |
| https://hunted.space/dashboard/directus/launches/directus-9 | 2026-11-09 | ok |
| https://hunted.space/product/appwrite/launches/appwrite-2 | 2026-11-09 | ok |
| https://hunted.space/product/directus/launches/directus-9 | 2026-11-09 | ok |
| https://hunted.space/product/payload-cms | 2026-11-09 | partial ("no data available" — overview template not populated for this product) |
| https://hunted.space/product/pocketbase | 2026-11-09 | partial ("no data available" — same as above) |
| https://www.producthunt.com/launch | 2026-11-09 | partial (loaded but content was a live-leaderboard feed, not stable guide text; collection URL used instead) |
| https://www.producthunt.com/p/convex/convex | 2026-11-09 | blocked 403 (direct fetch) / ok via hunted.space mirror of the same comment text |
| https://www.producthunt.com/p/directus/directus-9 | 2026-11-09 | blocked 403 |
| https://www.producthunt.com/p/payload-cms/payload-cms | 2026-11-09 | blocked 403 |
| https://www.producthunt.com/p/supabase/ama-w-supabase-ceo | 2026-11-09 | via search snippet |
| https://www.producthunt.com/posts/dub | 2026-11-09 | HTTP 403 on re-check (blocked or bot-walled; the example's numbers came from the researcher's read, see its entry) |
| https://www.producthunt.com/products/appwrite/launches/appwrite-2 | 2026-11-09 | HTTP 403 on re-check (blocked or bot-walled; the example's numbers came from the researcher's read, see its entry) |
| https://www.producthunt.com/products/convex/launches/convex | 2026-11-09 | HTTP 403 on re-check (blocked or bot-walled; the example's numbers came from the researcher's read, see its entry) |
| https://www.producthunt.com/products/directus/launches/directus-9 | 2026-11-09 | HTTP 403 on re-check (blocked or bot-walled; the example's numbers came from the researcher's read, see its entry) |
| https://www.producthunt.com/products/directus?launch=directus-9 | 2026-11-09 | via search snippet (full thread blocked 403 on direct fetch) — (maker comment opening) |
| https://www.producthunt.com/products/payload-cms/launches/payload-cms | 2026-11-09 | HTTP 403 on re-check (blocked or bot-walled; the example's numbers came from the researcher's read, see its entry) |
| https://www.producthunt.com/products/pocketbase | 2026-11-09 | blocked 403 |
| https://www.producthunt.com/products/resend | 2026-11-09 | via search snippet (hunted.space/product/resend) — (Resend Inboxes) |
| https://www.producthunt.com/products/supabase | 2026-11-09 | via search snippet (hunted.space/product/supabase/launches/supabase-alpha, /supabase-beta) — (Alpha/Beta launch data) |
| https://www.producthunt.com/products/trigger-dev | 2026-11-09 | via search snippet (hunted.space) — not used in final ranked examples, kept as backup data only — (v4 and Realtime AI launches) |
| https://www.producthunt.com/stories/how-we-launch-at-supabase | 2026-11-09 | ok |

### 6.3 LinkedIn and community show-and-tell examples and guides
Fetched: 2026-11-09
Status: partial (3 of 18 URLs blocked, missing or read via a mirror/snippet; see the table)

| URL | Fetched | Status |
|---|---|---|
| https://discord.com/invite/nk6C2qTeCq | 2026-11-09 | ok (confirms member count/description only; channel contents not crawlable) — (Convex Community invite page) |
| https://github.com/CrowdStrike/falconpy/discussions/1516 | 2026-11-09 | ok |
| https://github.com/CrowdStrike/falconpy/discussions/categories/show-and-tell | 2026-11-09 | ok (listing only, used to confirm the serial-release pattern) |
| https://github.com/orgs/supabase/discussions/51878 | 2026-11-09 | ok |
| https://github.com/orgs/supabase/discussions/categories/show-and-tell | 2026-11-09 | ok (listing only) |
| https://github.com/osTicket/roadmap/discussions/72 | 2026-11-09 | ok |
| https://github.com/pmndrs/jotai/discussions/3209 | 2026-11-09 | ok |
| https://github.com/tailwindlabs/tailwindcss/discussions/categories/show-and-tell | 2026-11-09 | ok (listing only, not used as a ranked example — near-zero engagement on every visible thread) |
| https://ligosocial.com/blog/how-to-write-a-linkedin-launch-post-templates-examples-and-best-practices-2025 | 2026-11-09 | via search snippet |
| https://ourcodeworld.com/articles/read/2407/a-developers-guide-to-publishing-eye-catching-linkedin-posts | 2026-11-09 | via search snippet |
| https://www.answeroverflow.com/c/1019350475847499849 | 2026-11-09 | blocked 403/429 — rate-limited, not used as a source — (Convex Discord indexed by Answer Overflow) |
| https://www.launchwake.com/channels/discord-supabase | 2026-11-09 | ok |
| https://www.linkedin.com/posts/james-mikrut-3202985a_payload-cloud-is-live-activity-7048667132678590467-YofY | 2026-11-09 | ok |
| https://www.linkedin.com/posts/paulcopplestone_every-few-months-supabase-does-a-launch-activity-7135649105879465984-8Ma_ | 2026-11-09 | ok |
| https://www.linkedin.com/posts/paulcopplestone_its-supabase-launch-week-yesterday-we-launched-activity-7095347969490657280-GS-Y | 2026-11-09 | ok |
| https://www.linkedin.com/posts/paulcopplestone_supabase-vector-the-postgres-vector-database-activity-7069800988135624704-5rHN | 2026-11-09 | ok |
| https://www.linkedin.com/posts/zenorocha_today-were-launching-resend-inboxes-an-activity-7518715636206764033-YWts | 2026-11-09 | ok |
| https://www.soar.sh/blog/self-promotion-on-discord | 2026-11-09 | ok |

### 6.4 dev.to, Hashnode, launch-week feature posts and recap pages
Fetched: 2026-11-09
Status: partial (5 of 60 URLs blocked, missing or read via a mirror/snippet; see the table)

| URL | Fetched | Status |
|---|---|---|
| https://aloiacms.com/articles/version-1-0-released | 2026-11-09 | HTTP 200 on re-check |
| https://authorizer.dev | 2026-11-09 | HTTP 200 on re-check |
| https://blog.authorizer.dev/introducing-authorizer-10 | 2026-11-09 | ok |
| https://blog.platformatic.dev/watt-v318-unlocks-nextjs-16s-revolutionary-use-cache-directive-with-redisvalkey | 2026-11-09 | HTTP 200 on re-check |
| https://dev.to/api/articles/appwrite/everything-new-in-appwrite-10-43o6 | 2026-11-09 | ok |
| https://dev.to/api/articles/nocobase/major-update-open-source-no-codelow-code-platform-nocobase-v10-officially-released-4edk | 2026-11-09 | ok (not used — self-canonical, 0 engagement) |
| https://dev.to/api/articles/roelofjanelsinga/aloia-cms-version-1-0-0-has-released-bo8 | 2026-11-09 | ok |
| https://dev.to/api/articles/supabase/introducing-vector-buckets-3134 | 2026-11-09 | ok |
| https://dev.to/api/articles?username=appwrite | 2026-11-09 | ok |
| https://dev.to/api/articles?username=convex | 2026-11-09 | ok |
| https://dev.to/api/articles?username=directus | 2026-11-09 | ok |
| https://dev.to/api/articles?username=strapi | 2026-11-09 | ok |
| https://dev.to/api/articles?username=supabase | 2026-11-09 | ok |
| https://dev.to/appwrite/everything-new-in-appwrite-10-43o6 | 2026-11-09 | HTTP 200 on re-check |
| https://dev.to/directus/migrating-from-notion-to-directus-4epm | 2026-11-09 | HTTP 200 on re-check |
| https://dev.to/roelofjanelsinga/aloia-cms-version-1-0-0-has-released-bo8 | 2026-11-09 | HTTP 200 on re-check |
| https://dev.to/strapi/introducing-yearly-plans-and-new-limits-for-strapi-cloud-165l | 2026-11-09 | HTTP 200 on re-check |
| https://dev.to/supabase/introducing-vector-buckets-3134 | 2026-11-09 | HTTP 200 on re-check |
| https://directus.com/resources/v11-release-notes | 2026-11-09 | ok |
| https://docs.directus.io/blog/ | 2026-11-09 | HTTP 404 on re-check; cited only as the prefix of Directus's canonical_url pattern |
| https://dub.co/blog/introducing-webhooks | 2026-11-09 | HTTP 200 on re-check |
| https://dub.co/blog/launch-week-recap | 2026-11-09 | ok |
| https://hashnode.com/blog/we-just-open-sourced-passmark-the-ai-regression-testing-framework | 2026-11-09 | ok |
| https://hashnode.com/posts/introducing-authorizer-10/62fa76cdfffdab933bded2b4 | 2026-11-09 | ok |
| https://hashnode.com/posts/watt-v318-unlocks-nextjs-16s-revolutionary-use-cache-directive-with-redisvalkey/691c8a1cb2114120150d0c87 | 2026-11-09 | ok |
| https://hn.algolia.com/api/v1/search?query=Directus%2011&tags=story | 2026-11-09 | ok |
| https://hn.algolia.com/api/v1/search?query=Payload%20CMS&tags=story | 2026-11-09 | ok |
| https://hn.algolia.com/api/v1/search?query=PayloadCMS+Launch+Week&tags=story | 2026-11-09 | ok |
| https://hn.algolia.com/api/v1/search?query=Resend%20launch%20week&tags=story | 2026-11-09 | ok (0 hits — Resend's own launch weeks don't appear to get separately submitted to HN under that phrase; not used) |
| https://hn.algolia.com/api/v1/search?query=Supabase+Branching&tags=story | 2026-11-09 | ok |
| https://hn.algolia.com/api/v1/search?query=Supabase+CLI+v2+Config+as+Code&tags=story | 2026-11-09 | ok |
| https://hn.algolia.com/api/v1/search?query=Supabase+Realtime+Multiplayer&tags=story | 2026-11-09 | ok |
| https://hn.algolia.com/api/v1/search?query=Trigger.dev&tags=story | 2026-11-09 | ok |
| https://launchweek.dev/lw/faq.md | 2026-11-09 | ok |
| https://launchweek.dev/lw/n/dub.md | 2026-11-09 | ok |
| https://launchweek.dev/n/product-hunt | 2026-11-09 | blocked 404 |
| https://launchweek.dev/p/raycast | 2026-11-09 | blocked 404 (not used; correct path is /lw/n/raycast.md, not fetched further — sufficient guide material already found) |
| https://news.ycombinator.com/item?id=32665325 | 2026-11-09 | HTTP 200 on re-check |
| https://news.ycombinator.com/item?id=45250720 | 2026-11-09 | HTTP 200 on re-check |
| https://payloadcms.com/ | 2026-11-09 | HTTP 200 on re-check |
| https://payloadcms.com/posts/blog/launch-week-day-3 | 2026-11-09 | ok |
| https://payloadcms.com/posts/blog/payload-30-the-first-cms-that-installs-directly-into-any-nextjs-app | 2026-11-09 | HTTP 200 on re-check |
| https://resend.com/blog/launch-week-1-wrap-up | 2026-11-09 | ok |
| https://resend.com/handbook/marketing/how-we-keep-momentum | 2026-11-09 | ok |
| https://stack.convex.dev/row-level-security | 2026-11-09 | ok |
| https://strapi.io/blog/introducing-yearly-plans-and-new-limits-for-strapi-cloud | 2026-11-09 | HTTP 200 on re-check |
| https://supabase.com/blog/cli-v2-config-as-code | 2026-11-09 | ok |
| https://supabase.com/blog/launch-week-13-top-10 | 2026-11-09 | ok |
| https://supabase.com/blog/supabase-how-we-launch | 2026-11-09 | ok |
| https://supabase.com/blog/supabase-local-dev | 2026-11-09 | HTTP 200 on re-check |
| https://supabase.com/blog/supabase-realtime-multiplayer-general-availability | 2026-11-09 | ok |
| https://supabase.com/blog/vector-buckets | 2026-11-09 | HTTP 200 on re-check |
| https://supabase.com/launch-week/13 | 2026-11-09 | ok |
| https://supabase.com/launch-week/15 | 2026-11-09 | blocked 404 (not used) |
| https://trigger.dev | 2026-11-09 | HTTP 200 on re-check |
| https://trigger.dev/launchweek/2 | 2026-11-09 | ok |
| https://trigger.dev/launchweek/2/preview-branches | 2026-11-09 | ok |
| https://trigger.dev/launchweek/2/trigger-v4-ga | 2026-11-09 | ok |
| https://www.strategicnerds.com/blog/using-launch-blog-posts-to-drive-growth-of-developer-products | 2026-11-09 | ok |
| https://www.strategicnerds.com/blog/writing-the-perfect-launch-blog-post | 2026-11-09 | blocked 410 (not used) |

### 6.5 DevHunt, Cooperpress, This Week in React, jamstack.org, awesome-nextjs
Fetched: 2026-11-09
Status: partial (1 of 29 URLs blocked, missing or read via a mirror/snippet; see the table)

| URL | Fetched | Status |
|---|---|---|
| https://cooperpress.com/files/cooperpress-media-kit-q4-2026.pdf | 2026-11-09 | via search snippet — ("over 170,000" JS Weekly subscribers) |
| https://devhunt.org/tool/bcms | 2026-11-09 | ok |
| https://devhunt.org/tool/bloggr | 2026-11-09 | ok |
| https://devhunt.org/tool/contentrain | 2026-11-09 | ok |
| https://devhunt.org/tool/react-bricks | 2026-11-09 | ok |
| https://devhunt.org/tools/cms | 2026-11-09 | ok |
| https://genpm.net | 2026-11-09 | HTTP 200 on re-check |
| https://github.com/ButterCMS/react-cms-blog-with-next-js | 2026-11-09 | HTTP 200 on re-check |
| https://github.com/PictureElement/nextjs-strapi-portfolio-starter | 2026-11-09 | HTTP 200 on re-check |
| https://github.com/codelit/courselit | 2026-11-09 | HTTP 200 on re-check |
| https://github.com/jamstack/jamstack.org | 2026-11-09 | HTTP 200 on re-check |
| https://github.com/jamstack/jamstack.org/blob/main/src/site/headless-cms/decap-cms.md | 2026-11-09 | ok — (via `gh api`) |
| https://github.com/jamstack/jamstack.org/blob/main/src/site/headless-cms/directus.md | 2026-11-09 | ok — (via `gh api`) |
| https://github.com/jamstack/jamstack.org/blob/main/src/site/headless-cms/keystone.md | 2026-11-09 | ok — (via `gh api`) |
| https://github.com/jamstack/jamstack.org/blob/main/src/site/headless-cms/payload-cms.md | 2026-11-09 | ok — (via `gh api`) |
| https://github.com/jamstack/jamstack.org/blob/main/src/site/headless-cms/strapi.md | 2026-11-09 | ok — (via `gh api`) |
| https://github.com/jamstack/jamstack.org/blob/main/src/site/headless-cms/tinacms.md | 2026-11-09 | ok — (via `gh api`) |
| https://github.com/jamstack/jamstack.org/pull/1057 | 2026-11-09 | ok — (LeadCMS, `gh pr diff`) |
| https://github.com/loootai/looot-network | 2026-11-09 | HTTP 200 on re-check |
| https://github.com/unicodeveloper/awesome-nextjs/pull/652 | 2026-11-09 | ok — (`gh pr diff`) |
| https://github.com/unicodeveloper/awesome-nextjs/pull/725 | 2026-11-09 | ok — (`gh pr diff`) |
| https://jamstack.org | 2026-11-09 | ok — --state merged --search headless-cms` |
| https://javascriptweekly.com/issues/809 | 2026-11-09 | ok |
| https://raw.githubusercontent.com/unicodeveloper/awesome-nextjs/master/CONTRIBUTING.md | 2026-11-06 (`sources.md` §5.7) | ok (prior fetch, reused) |
| https://raw.githubusercontent.com/unicodeveloper/awesome-nextjs/master/README.md | 2026-11-09 | ok |
| https://react.statuscode.com/issues/291 | 2026-11-09 | ok |
| https://thisweekinreact.com/editorial-line | 2026-11-09 | ok |
| https://thisweekinreact.com/editorial-line, | 2026-11-06 (`sources.md` §5.1–5.2) | ok (prior fetch, reused) — https://cooperpress.com/ (submission/contact stance) |
| https://thisweekinreact.com/newsletter/231 | 2026-11-09 | ok |

### 6.6 Cross-channel launch-post guides
Fetched: 2026-11-09
Status: partial (7 of 18 URLs blocked, missing or read via a mirror/snippet; see the table)

| URL | Fetched | Status |
|---|---|---|
| https://help.producthunt.com/en/articles/17350772-launch-guide | 2026-11-09 | blocked 404 |
| https://help.producthunt.com/en/articles/17734384-5-how-to-promote-your-launch-and-what-to-avoid | 2026-11-09 | ok |
| https://help.producthunt.com/en/articles/17734397-6-what-to-do-during-and-after-your-launch | 2026-11-09 | ok |
| https://launchweek.dev/lw/faq.md | 2026-11-09 | ok |
| https://launchweek.dev/n/product-hunt | 2026-11-09 | blocked 404 |
| https://launchweek.dev/p/dub(.md) | 2026-11-09 | blocked 404 |
| https://news.ycombinator.com/item?id=22336638 | 2026-11-09 | ok |
| https://news.ycombinator.com/yli.html | 2026-11-09 | HTTP 200 on re-check |
| https://plausible.io/blog/product-hunt-launch | 2026-11-09 | ok — (fetched via websocket.plausible.io mirror) |
| https://posthog.com/blog/after-the-hn-launch | 2026-11-09 | ok |
| https://relayto.com/yc-startup-school/how-to-launch-again-and-again-f2id44ijlbkhj | 2026-11-09 | blocked (client-rendered, no text) |
| https://supabase.com/blog/supabase-how-we-launch | 2026-11-09 | ok |
| https://vexcms.dev | 2026-11-09 | HTTP 200 on re-check |
| https://vexcms.dev/posts/vexcms-0-1-0 | 2026-11-09 | HTTP 404 expected: the announcement is a draft until D1 (canonical URL, cited in a constraint) |
| https://videohighlight.com/v/3xU050kMbHM | 2026-11-09 | ok (third-party transcript summary of the YC talk, used to recover #5's content) |
| https://www.markepear.dev/blog/dev-tool-hacker-news-launch | 2026-11-09 | ok |
| https://www.markepear.dev/blog/developer-marketing-guide | 2026-11-09 | partial (read first ~300 of 905 lines; general dev-marketing context, not launch-post-specific, not separately cited) |
| https://www.ycombinator.com/library/6i-how-to-launch-again-and-again | 2026-11-09 | partial (metadata only, no transcript on page) |

---

## Re-fetch log (L, step 12)

Re-fetched 2026-11-10 against the working tree reviewed for L (`dev` @ e49d7ac3 plus uncommitted
contributor-workflow changes). `unchanged` = every quoted excerpt still matches; `changed` =
re-quoted below and the affected brief in `launch-kit.md` updated in the same pass. §3 (Reddit),
§4 and the unused §5 channels are not re-fetched; §6 is reading material, not rules.

| URL | § | Date | Status | Note |
|---|---|---|---|---|
| https://news.ycombinator.com/showhn.html | 1.1 | 2026-11-10 | unchanged | All 11 quoted lines present verbatim. |
| https://news.ycombinator.com/newsguidelines.html | 1.2 | 2026-11-10 | unchanged | All quoted lines present verbatim (generated-text, promotion, upvote-solicitation rules all intact). |
| https://news.ycombinator.com/newsfaq.html | 1.3 | 2026-11-10 | unchanged | Repost, upvote/comment-solicitation, and YC/HN relationship quotes all present verbatim. |
| https://news.ycombinator.com/launches | 1.4 | 2026-11-10 | unchanged | Still exclusively "Launch HN:" posts, every one of the 30 sampled entries YC-batch-tagged (e.g. "(YC W23)", "(YC S26)"). |
| https://news.ycombinator.com/item?id=22336638 | 1.4 | 2026-11-10 | unchanged | dang's full tips comment fetched via HN Algolia API; every quoted line (hand-write text, backstory, no-marketing-language, friends-not-boosting, repost-cadence) matches verbatim, including the 2026-03-28 edit about not using an LLM. |
| https://help.producthunt.com/en/articles/17734306-1-how-product-hunt-works | 2.1 | 2026-11-10 | unchanged | Maker/hunter, 12:01 AM PT go-live, no-paid-upvotes, personal-account, verified-email quotes all intact. |
| https://help.producthunt.com/en/articles/17734355-3-set-your-goals-and-pick-your-launch-date | 2.2 | 2026-11-10 | unchanged | 12:01 AM–midnight PT window, 30-day scheduling lookahead, 2-launches/day, weekday/weekend framing all intact. |
| https://help.producthunt.com/en/articles/17834537-4-build-your-product-page | 2.3 | 2026-11-10 | unchanged | Name/tagline/description char limits, logo spec (240×240, ≤2MB), image spec (1270×760, ≥1), pricing field, ≤3 launch tags, 5,000-char Maker comment, seven required fields, 2-month relaunch trigger, and open-source/repo-link field all intact verbatim. |
| https://help.producthunt.com/en/articles/17734384-5-how-to-promote-your-launch-and-what-to-avoid | 2.4 | 2026-11-10 | unchanged | "Never ask for upvotes", no fake accounts, "try it/comment/share feedback", and "communities you've never posted in before" quotes all intact. |
| https://help.producthunt.com/en/articles/17734411-7-relaunch-your-product | 2.5 | 2026-11-10 | unchanged | 2-month relaunch-request threshold, "small fixes...aren't enough" and anti-URL-swap quotes all intact. |
| https://help.producthunt.com/en/articles/3615694-community-guidelines | 2.6 | 2026-11-10 | unchanged | Anti-spam/self-promo and real-profile requirements intact (profile quote now sits inside a slightly longer lead-in sentence — same wording, not reworded). |
| https://help.producthunt.com/en/articles/484935-can-i-ask-my-community-friends-family-to-upvote-a-product | 2.7 | 2026-11-10 | unchanged | Quoted algorithm-penalty sentence intact verbatim. |
| https://help.producthunt.com/en/articles/9883485-product-hunt-featuring-guidelines | 2.8 | 2026-11-10 | **changed** | See Changed quotes below — the "No Vaporware" criterion was loosened. |
| https://devhunt.org/faq | 2.9 | 2026-11-10 | unchanged | All quoted lines (what-is-DevHunt, how-to-launch, free-vs-$49-launch, voting/auth, eligible tool types, week-long format, super-boost pricing) present verbatim. |
| https://devhunt.org/llms.txt | 2.10 | 2026-11-10 | unchanged | Free-listing and $49-launch bullet points, and the five named categories (Open Source, DB, Code, API, Boilerplate) all present verbatim. |
| https://cooperpress.com/ | 5.1 | 2026-11-10 | unchanged | "editor@cooperpress.com" and "We're always happy to talk!" both present verbatim; still no public submission form, still one shared editorial address. |
| https://thisweekinreact.com/ | 5.2 | 2026-11-10 | unchanged | Still no "Submit" nav item or documented submission route; page is now a testimonials wall (nav/contact details not re-displayed on this fetch, but no submission-related rule was ever quoted here to break — original section was explicitly "no quoted rule... because none is published"). |
| https://github.com/jamstack/jamstack.org | 5.4 | 2026-11-10 | unchanged | Root README "We accept contributions submitted as pull requests" quote present verbatim; confirmed `src/site/headless-cms/` still lists `caisy.md` and ~140 other per-CMS files in the same format, directory convention unchanged. |
| https://raw.githubusercontent.com/unicodeveloper/awesome-nextjs/master/CONTRIBUTING.md | 5.7 | 2026-11-10 | unchanged | All quoted formatting rules ("Make an individual pull request...", "[Title Case Name](link) - Description.", capital/full-stop rule, "New categories...are welcome") present verbatim. |
| https://discord.com/invite/nk6C2qTeCq | 5.10 | 2026-11-10 | unchanged | Still blocked — only OG/meta tags fetchable (tagline + member count, now 16,680 vs 16,681 previously, negligible drift); channel rules still not readable logged out. |
| https://dev.to/p/editor_guide | 5.13 | 2026-11-10 | unchanged | canonical_url, 4-tag-max, ai_disclosure_level field (with all four disclosure levels), and 200-megapixel GIF-frame limit all present verbatim. |
| https://raw.githubusercontent.com/Hashnode/support/main/docs/write-an-article.md | 5.14 | 2026-11-10 | unchanged | "Add Original Article"/canonical-URL quote and "hide from Hashnode and display on my blog only" quote both present verbatim. |
| https://www.linkedin.com/help/linkedin/answer/a528176 | 5.17 | 2026-11-10 | **blocked→found (false assumption)** | See note below — the original "no official doc" finding no longer holds. |

**Product Hunt — Featuring Guidelines (§2.8), https://help.producthunt.com/en/articles/9883485-product-hunt-featuring-guidelines**
- Old: *"**No Vaporware**: We only feature products that are ready for use"*
- New: *"**No Vaporware**: We only feature products that are ready for use or have a clear path to launch."*
- The added clause ("or have a clear path to launch") loosens this criterion — a pre-launch/roadmap-stage product may now qualify where the old wording required it to already be ready for use. Doesn't change the launch-kit plan materially (VexCMS 0.1.0 is functional at launch) but is worth noting as a real wording change, not drift.

No other in-use URL had a quote go missing or get reworded; all other rows above are verbatim matches.

**New rules found on re-fetch**

1. **Product Hunt Featuring Guidelines (§2.8)** now lists **"Waitlisted products (unless immediate access is provided)"** as the first bullet under "What We Don't Feature" — this bullet was not in the original quoted list at all (new, not a rewording). It directly reinforces the Show-HN "no signup barriers" theme already in the launch plan: VexCMS must not be waitlisted/invite-gated at PH submission time, must offer immediate access.
2. **Product Hunt Featuring Guidelines (§2.8)** — the "Hardware" exclusion gained a worked example: *"Hardware (unless it has a prominent digital component e.g., AI wearables)"* (previously just "...prominent digital component)"). Not relevant to VexCMS (software product) but noted as an addition, not a rewording of substance.
3. **LinkedIn (§5.17) — corrected finding, not a new rule on the page itself, but a correction to the spec's own research gap:** the spec recorded §5.17 as `Status: blocked` with "no official LinkedIn Help/Developer doc was located." That is no longer true: **https://www.linkedin.com/help/linkedin/answer/a528176 ("Post and share updates")** is live, official, and states a **3,000-character hard cap** on standard posts ("If your post exceeds 3000 characters, you can instead write an article using LinkedIn's Publishing Platform"), plus a documented anti-automation clause: *"If we detect excessive post creation that indicates inauthentic activity, or the use of an automation tool, we may limit the visibility of those posts."* This last clause is a concrete new constraint for the launch kit: scheduling/automating the LinkedIn cross-post (e.g. via a bot/scheduler) risks visibility suppression — post manually or via LinkedIn's own native scheduler (also documented on the same page: "If you'd like your post to go live at a later time, you can schedule it in advance"). The page also links out to **"Best practices for content created with the help of AI"** (https://www.linkedin.com/help/linkedin/answer/a1481496) — relevant given the launch-kit's AI-authorship concerns elsewhere (HN/dev.to); this companion doc was not fetched in this pass and should be read before finalizing the LinkedIn post workflow.

No new rules were found on the HN, DevHunt, Cooperpress, This Week in React, jamstack.org, awesome-nextjs, Convex Discord, dev.to, or Hashnode pages beyond what was already quoted in the 2026-11-06 sources file.
