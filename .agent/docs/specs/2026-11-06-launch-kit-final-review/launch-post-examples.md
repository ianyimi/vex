# Launch post examples — VexCMS 0.1.0

> Reading material for the developer before step 6 (spec step 24, Design Decision 25). Real posts by
> other projects, ranked per slot, with their numbers and why they worked. **Nothing here is VexCMS
> post text** (Design Decision 2): quotes are short excerpts from other makers' posts, and the
> checklists say what to check, never what to write. Collected 2026-11-09 by research subagents;
> every URL is in `sources.md` § 6 with its fetch date and status.

## How to use this

- One section per `launch-kit.md` slot, in kit order. Each has the slot's constraints (from
  `sources.md` and the spec), 3–5 ranked examples, and a checklist distilled from them.
- Ranking tiers: **1** same platform and similar content (OSS dev tools, CMSs, backend frameworks,
  Convex ecosystem); **2** same platform, other dev tools; **3** other platforms.
- Numbers were read 2026-11-09 from the source named beside them; `[UNVERIFIED]` means the source
  blocked the read and the entry says why.
- Gaps the research hit are listed in § Research notes at the end. The ones that change a decision:
  awesome-nextjs has no CMS section (pick Apps or Boilerplates); This Week in React filters out
  single-vendor product news; Payload, Strapi, Directus, TinaCMS, Keystone and Convex have no strong
  maker-authored Show HN to learn from.

## Guides

### Cross-channel launch guides

#### 1. How we launch at Supabase
URL: https://supabase.com/blog/supabase-how-we-launch
Author: Ant Wilson (Supabase co-founder/CTO)
Date: 2021-11-26 — fetched 2026-11-09

- Supabase's "Launch Week" grew out of a near-accident: an early user posted them to HN unprompted and it became one of the most-upvoted dev-tool launches ever, which forced the team to formalize a repeatable launch process afterward.
- Planning starts with a cross-functional "Planning Meeting" (a shared whiteboard dump of everything related to the company) before anyone commits to specific features, so marketing and engineering load the same context before scoping the week.
- "We very rarely hold back features until Launch Week... we encourage everyone to ship features as early as possible" — full write-ups and marketing push happen during the week, but the underlying feature may have shipped (and been quietly announced) weeks before.
- Each day of launch week runs off a minute-by-minute schedule (e.g. "7:55am Product Hunt goes live," "8:00am Blog post goes live") — written in advance so the day is mechanical, not improvised.
- "One of our learnings from previous Launch Weeks was to no longer ship to prod on the day of the Launch itself" — code freezes a week early; that week is spent on content, QA, and "swarming" on rough edges.
- The retrospective is called "the **most important** phase of the entire process" — skipping it means repeating the same mistakes; results get read aloud at the start of the next planning meeting.
- Applies to: www feature post, recap page, newsletter pitch (multi-day format and scheduling), ph (same-day coordination).

#### 2. launchweek.dev — FAQ
URL: https://launchweek.dev/lw/faq.md
Author: Varun Anand (maintainer), with quotes from Rory Wilding (Supabase COO), Zeno Rocha (Resend CEO), Brayden Wilmoth (Outerbase founder/CTO), Ant Wilson (Supabase CTO)
Date: undated (continuously updated) — fetched 2026-11-09

- "Launch weeks have been great for both aligning the team and getting traction within the community." — Rory Wilding, Supabase.
- "Launch weeks are high peaks (...) They create buzz and excitement around the product." — Zeno Rocha, Resend.
- "We did 3 launch weeks in 2024, and each one had a meaningful impact on every aspect of the business. If you're considering ever doing it — do it." — Brayden Wilmoth, Outerbase (a solo/small-team example, not just big companies).
- A launch week doesn't have to be 5 days or ship something brand-new daily — it's defined simply as "a week where a company announces a new feature every day," and real examples ran 3–6 days.
- It's explicitly framed as complementary to, not a replacement for, Product Hunt: "Product Hunt definitely *is* a great place to launch dev-first products" — several tracked companies used both.
- Applies to: recap page, www feature post, ph (cross-posting), newsletter pitch (weekly roundup format it runs itself).

#### 3. Product Hunt Help Center — "5. How to promote your launch (and what to avoid)"
URL: https://help.producthunt.com/en/articles/17734384-5-how-to-promote-your-launch-and-what-to-avoid
Author: Product Hunt (Juan Francisco Secchi, credited writer)
Date: updated ~2026 (undated) — fetched 2026-11-09

- "The makers who do best on launch day usually started weeks earlier" — by commenting on other launches and being active in the Forums before their own turn.
- Pre-launch checklist: tell your team/users/newsletter list in advance, prep email/social copy ahead of time, add a PH badge to your site — "so you're not writing them at 1 AM."
- "Share your launch link everywhere your audience already is... Communities you've never posted in before are not the place to drop a link."
- Hard rule, stated in bold: "**Never ask for upvotes. Asking people directly to upvote, or running anything that requires or rewards upvotes, breaks Product Hunt's rules.**"
- Common mistakes listed: inviting your community only on launch day, not prepping assets ahead, and believing you need a famous "hunter."
- Applies to: ph, linkedin, discord, devto/hashnode (cross-posting audience you already have), newsletter pitch.

#### 4. Product Hunt Help Center — "6. What to do during and after your launch"
URL: https://help.producthunt.com/en/articles/17734397-6-what-to-do-during-and-after-your-launch
Author: Product Hunt
Date: updated ~2026 (undated) — fetched 2026-11-09

- "The most important thing you can do is be there. Reply to comments quickly and honestly" — split shifts with a team if you have one so someone is always online.
- "If you can use your own product to answer questions, even better. A quick demo video reply or a live link... lands better than a long paragraph."
- After launch: "Compare your results with the goals you set before launch... write down what worked and what didn't. You'll want it for your next launch" (same retrospective discipline as Supabase).
- Recommends turning feedback into shipped improvements and explicitly telling the community later "how their feedback shaped the product."
- Applies to: ph, recap page, newsletter pitch, discord (follow-up engagement).

#### 5. YC Startup Library — "How to launch (again and again)"
URL: https://www.ycombinator.com/library/6i-how-to-launch-again-and-again (video; transcript summary via https://videohighlight.com/v/3xU050kMbHM)
Author: Kat Mañalac (YC partner)
Date: undated talk (Startup School) — fetched 2026-11-09

- Core thesis: "launching should not be viewed as a one-time event" — teams should look for many small launch moments (silent launch, friends-and-family, internal communities, strangers) on the way to a big public one, not save everything for a single day.
- A "silent launch" needs almost nothing: domain, name, a short description, contact info, and a call to action — used to start collecting an email list and test messaging before anything is fully built.
- "Understanding community rules is crucial when launching; each platform has its own guidelines that should be respected" — and if new to a community, ask existing members how launches are received there before posting.
- Advises cutting jargon and marketing language from landing-page copy, keeping it tight because attention spans on these channels are short.
- Build the email list continuously from every interaction (investors, friends, early users) so there's an audience to notify the moment there's real news, rather than starting outreach from zero on launch day.
- Applies to: hn (community-specific norms), newsletter pitch (list-building), discord (community launch etiquette), www feature post (early silent-launch pages).

#### 6. Developer Markepear — "How to launch a dev tool on Hacker News"
URL: https://www.markepear.dev/blog/dev-tool-hacker-news-launch
Author: Aleksander Czakon (Developer Markepear)
Date: 2026-09-01 — fetched 2026-11-09

- Distills HN's own admin guidance (https://news.ycombinator.com/yli.html) into four buckets: **style** ("talk to HN as fellow builders," no superlatives, don't sell — "let them sell themselves"), **product/offer** (free + frictionless trial, transparent pricing), **format** (introduce yourself → state what it is in one sentence → the problem → your backstory → the solution and what's different → invite feedback), and **comments** (answer fast, agree with the positive intent behind criticism first).
- Walks the highest-upvoted dev-tool HN launch (Fly.io, "Launch HN: Fly.io (YC W20)") point-by-point against that checklist as a worked example.
- "The HN crowd really likes and overindexes on open-source, privacy-first products. So if you actually are an 'open-source alternative to X,' say it right in the title."
- "Link out to the GitHub repo. This makes your 'offer' more HN dev audience-centric... [it] hints at it being easy to run yourself, at it being an actual working product."
- Applies to: hn, www feature post (same narrative arc — problem, backstory, differentiation — reused for a blog launch post).

#### 7. dang (HN moderator) — Show HN advice comment
URL: https://news.ycombinator.com/item?id=22336638
Author: dang (Hacker News moderator)
Date: 2020-02-15, edited 2026-03-28 — fetched 2026-11-09

- The most widely cited informal essay on writing a Show HN post; linked from nearly every third-party HN launch guide found in this research.
- "Include text giving the backstory of how you came to work on this, and explaining what's different about it. That tends to seed discussion in a good direction."
- "Include a clear statement of what your project is or does. If you don't, the discussion will consist of 'I can't tell what this is.'"
- "Drop any language that sounds like marketing or sales. On HN, that is an instant turnoff. Use factual, direct language. Personal stories and technical details are great."
- "For Show HN, the product/project needs to actually exist and there needs to be a way for people to try it out. It can't just be a landing page..."
- 2026 addendum, verbatim: "Write your text by hand. Don't use an LLM to generate any of it (not even a tiny bit, including to edit or spruce it up)... This is a big dividing line at present!"
- Applies to: hn only (format and etiquette are HN-specific; the "backstory + what's different" structure is echoed by Markepear's guide above for other channels).

#### 8. PostHog — "After the HN launch"
URL: https://posthog.com/blog/after-the-hn-launch
Author: James Hawkins (PostHog co-founder/CEO)
Date: 2020-03-01 — fetched 2026-11-09

- They set an explicit, modest success bar before posting: "happy with 500 stars, pleased with 700 and delighted with 1,000" — framing the goal as finding people who loved it, not maximizing reach.
- "Pro-tip for next time, make sure you have tagged your repo appropriately — we had niche tags, and it was only once we changed them that we got discovered [on GitHub Trending]."
- Treats the launch as the start of a retention problem, not the finish line: "Our current focus is to make sure that we retain these users... every piece of marketing we do adds permanent value" only if people stick around.
- Describes a lightweight weekly operating rhythm around launches: "Every Monday, we do a short post mortem of the week before, and set new weekly goals."
- Applies to: hn, recap page, newsletter pitch (post-launch retention framing).

#### 9. Plausible Analytics — "How not to launch on Product Hunt (and lessons from our successful launch)"
URL: https://plausible.io/blog/product-hunt-launch
Author: Marko Saric (Plausible co-founder)
Date: 2020-09-02 — fetched 2026-11-09

- Opens by warning against the genre it's part of: "certainly don't go to search engines looking for launch advice or guides... so much spam and so much bad and generic advice."
- Launched on PH ~1.5 years after shipping the product, deliberately, once they had an audience: "we had an audience of about 1,000 Twitter followers when we launched... built in about 4 months."
- Lays out two explicit strategies as a real choice rather than a single rule: launch immediately with no audience and "play the Product Hunt game," or delay until you've built one so "you don't need to play the game."
- "We told nobody about our launch on Product Hunt until our listing was live" — no pre-launch emails, no advance notice to anyone, contradicting the "warn your audience early" advice common elsewhere (see Disagreements).
- Quotes PH's own stance on hunters directly: "It used to matter, back in the day when we sent email notification to the hunter's followers, but we stopped doing that a long time ago."
- Applies to: ph, recap page, linkedin/discord/devto (cross-channel "share where your audience already is" pattern), www feature post.

### Cross-guide consensus

(Points at least 3 of the 9 guides above independently agree on.)

- **Never ask for, pay for, or orchestrate upvotes/comments.** Stated as a hard, bolded rule by both Product Hunt guides (#3, #4), reaffirmed by dang/HN (#7, consistent with the broader HN rules already logged in `sources.md` §1.2–§1.4), and implicit in how Plausible (#9) and PostHog (#8) describe their organic results.
- **Make the thing itself easy to try, with minimal signup friction, before you post anywhere.** dang/HN (#7: "needs to actually exist and there needs to be a way for people to try it out"), Markepear (#6: "give people an easy way to try it out, for free"), Product Hunt (#4: use the product itself to answer questions/demo), Supabase (#1: code frozen and tested a week before launch day).
- **Show up and answer comments fast, in your own voice, for the whole launch window.** Product Hunt (#4: "be there... reply to comments quickly"), Markepear/dang (#6, #7: answer fast, agree with intent first), PostHog (#8: retention/engagement framing), Supabase (#1: the engineer who built the feature is also the one who answers for it).
- **Drop marketing/sales language; lead with backstory, problem, and what's different.** dang (#7), Markepear (#6), echoed by Supabase's practice of having the builder (not a marketer) write the technical write-up (#1).
- **Build an audience/email list before you need it, continuously, not starting on launch day.** YC (#5: build the list from every interaction), Product Hunt (#3: "the makers who do best... started weeks earlier"), Plausible (#9: 4 months of audience-building before their PH launch).
- **Treat the launch as the start of a measurement/retrospective loop, not the end.** Supabase's formal retrospective (#1), Product Hunt's "compare your results with the goals you set before launch" (#4), PostHog's weekly post-mortems (#8), Plausible's referral/conversion breakdown after the fact (#9).

### Disagreements

- **Does the product need to be real and finished before you launch, or is a landing page itself a valid "launch"?** YC's Kat Mañalac (#5) explicitly endorses a "silent launch" — just a domain, name, short description, and a CTA — as a legitimate early launch type to start collecting signal. dang/HN (#7) and Product Hunt (per `sources.md` §2.8, "We only feature products that are currently available") explicitly rule this out for their own channels: HN Show-posts and Product Hunt listings must be a tryable, working product, not a landing page or market test.
- **Warn your audience in advance, or launch in total silence?** Product Hunt's own guide (#3) lists "give your people a heads-up" (email list, team, social prep) as a checklist item days/weeks ahead of launch, and Supabase (#1) runs a whole pre-launch week of coordinated prep. Plausible (#9), by contrast, launched on Product Hunt with zero advance notice to anyone — "we told nobody... until our listing was live" — and still had a top-of-day result, treating secrecy as the better call for their launch.
- **Does the specific person who "hunts"/submits your product matter?** Older/folk launch advice (cited inside Plausible's own post, #9, attributed to a third party: recruit a well-known hunter such as Chris Messina to submit for you) treats hunter identity as a lever worth pulling. Product Hunt's current mechanics, quoted in that same post, say otherwise: hunter-follower notifications were discontinued, so "it makes very little difference who hunts the product."

### Show HN

- HN Show HN Guidelines — https://news.ycombinator.com/showhn.html — fetched 2026-11-09 — "Show HN is for something you've made that other people can play with"; the project must be non-trivial and something you can actually try, ideally without signup barriers; don't post landing pages or fundraisers; don't ask friends to upvote or comment.
- dang's Show HN tips (item 22336638) — https://news.ycombinator.com/item?id=22336638 — fetched 2026-11-09 — include backstory text as the post or as a first comment if it doesn't appear automatically; include a clear statement of what the project does; drop marketing/sales language; **2026-03-28 edit added by dang**: "Write your text by hand. Don't use an LLM to generate any of it (not even a tiny bit, including to edit or spruce it up)" because LLM language is now generating backlash on HN — directly relevant to the hard rule that the developer must write every word himself.
- markepear.dev, "How to launch a dev tool on Hacker News" — https://www.markepear.dev/blog/dev-tool-hacker-news-launch — fetched 2026-11-09 — distills HN's own launch guidelines (`news.ycombinator.com/yli.html`) into style/product/format/comment checklists, then walks the Fly.io Launch HN post against every point as a worked example; also recommends leading with "open-source" framing and linking to the GitHub repo rather than a landing page.
- Lucas F. Costa, "How to do a successful Hacker News launch" — https://www.lucasfcosta.com/blog/hn-launch — fetched 2026-11-09 — gives paired good/bad title examples (e.g. "Show HN: Layerform – Open-source development environments using Terraform files" vs. a vaguer alternative); argues the repo README *is* the landing page for technical products; recommends cutting the draft by ~30% after a first pass and engaging every comment.

### Product Hunt

- **Product Hunt — Launch Guide collection (articles not in sources.md §2.1–2.8)** — https://help.producthunt.com/en/collections/19793093-launch-guide — fetched 2026-11-09
  - Article 2, "What kind of products get featured" (https://help.producthunt.com/en/articles/17734341-2-what-kind-of-products-get-featured): "A good test: could you explain it to your mom in one sentence? If not, keep rewriting" — the tagline/description plain-language bar.
  - Article 2 also: "It's a product, not content about one... People can try it... The maker is trustworthy" — restates the no-vaporware / live-product bar already in sources.md §2.8 but ties it explicitly to featuring odds, not just removal risk.
  - Article 6, "What to do during and after your launch" (https://help.producthunt.com/en/articles/17734397-6-what-to-do-during-and-after-your-launch): "Answer every comment you can, as close to real time as possible" and "If your launch seems to drop suddenly, we may have detected and removed suspicious activity on it."
  - Article 8, "Launch FAQ and myths" (https://help.producthunt.com/en/articles/17734646-8-launch-faq-and-myths): defines "Maker comment: The first comment on a launch, written by the maker" (the glossary source for the ph:maker-comment slot above), and debunks "Myth: Every upvote counts the same" — upvotes from new/low-quality accounts barely move a launch.
- **Dub.co — "How to get #1 on Product Hunt – a step-by-step playbook"** — https://dub.co/blog/product-hunt — fetched 2026-11-09 (founder Steven Tey, primary source, same-platform dev tool)
  - "This is probably the toughest – yet the most important step in the process" re: building a pre-launch community months (or years) ahead — for an open-source project specifically, "leverage your open-source community – whether it's on GitHub or Discord – to create traction early."
  - The first comment "can save you some time on launch day" if scheduled in advance, and should be "thoughtful but concise... a compelling & personal reason about why you decided to build this product."
  - Confirmed directly with PH's own CEO that linking straight to the PH page from social posts is not penalized: "we confirmed with the Product Hunt CEO himself that these are nothing but myths."
- **Supabase — "How we launch at Supabase"** (Ant Wilson, CTO) — https://www.producthunt.com/stories/how-we-launch-at-supabase — fetched 2026-11-09 (published on PH's own Stories section; same-platform BaaS)
  - Describes picking channels per feature: for a design-heavy launch (ui.supabase.com) they "made sure it ranked on Product Hunt," while a technical launch (Storage) was aimed at Hacker News instead — i.e. not every release needs a PH push.
  - Sample minute-by-minute launch-day schedule includes a fixed PH slot: "7:55am Product Hunt goes live / 8:00am Blog post goes live / 8:05am Post launch tweet 1" — illustrates sequencing PH against other channels rather than treating it in isolation.

### LinkedIn and Discord

- "LinkedIn Launch Post: 5 Templates + Launch Sequence" — https://ligosocial.com/blog/how-to-write-a-linkedin-launch-post-templates-examples-and-best-practices-2025 — fetched 2026-11-09
  - Covers picking a launch-day "angle" before writing, a week-long launch sequence (not just day-1), and best practices for the launch day itself and the days after.
- "A Developer's Guide to Publishing Eye-Catching LinkedIn Posts" — https://ourcodeworld.com/articles/read/2407/a-developers-guide-to-publishing-eye-catching-linkedin-posts — fetched 2026-11-09
  - LinkedIn's algorithm weights engagement and "dwell time"; the first visible lines before the "…see more" cutoff carry outsized weight; translating technical concepts for a broader professional audience (not just other engineers) is the core skill being taught.
- "Can I post my startup on Supabase Discord? — Rules & ban risk" — https://www.launchwake.com/channels/discord-supabase — fetched 2026-11-09
  - Self-promotion is tolerated only in #showcase; dropping links in support/general channels is treated as spam; a fresh, empty account posting a launch is the classic removal trigger — comment/contribute for a week or two first.
- "Self-promotion on Discord in 2026" — https://www.soar.sh/blog/self-promotion-on-discord — fetched 2026-11-09
  - "Discord is not a distribution channel first. It is a relationship environment first." Be useful first, promote second; keep promotional posts short, say why the link matters to *that* server, disclose affiliation, and never cross-post the same message into multiple channels.

### dev.to, Hashnode, feature posts and recap pages

- **How we launch at Supabase** — https://supabase.com/blog/supabase-how-we-launch — fetched 2026-11-09
  - Launch weeks exist because an early, unplanned Hacker News post ("one of the most upvoted dev tools launches ever") taught the team that a single big push drives a step-change in signups — the methodology was built backwards from that result, not designed first.
  - "We very rarely hold back features until Launch Week... we encourage everyone to ship features as early as possible" — the week is a marketing/retelling event, not a release-gating one.
  - Planning starts 3 months out with a "fixed timeline, flexible scope" meeting; a feature that isn't ready just gets pushed to the next launch week rather than rushed.
  - "One of our learnings... was to no longer ship to prod on the day of the Launch itself" — all engineering work finishes the week *before* launch week; launch week is content and go-live only.

- **launchweek.dev — FAQ** — https://launchweek.dev/lw/faq.md — fetched 2026-11-09
  - "A launch week doesn't have to last 5 days" — the shortest tracked launch week was 3 days (Dub), the longest 6 (Unkey).
  - "Do you ship new features every day? No... It's ideal to get all the major integrations done a week early" (quoting Supabase's CTO) — confirms the same "finish before the week starts" rule independently.
  - It is explicitly positioned as distinct from Product Hunt, not a replacement for it — the companion guide "Planning a launch week? Launch on Product Hunt, too" (https://launchweek.dev/n/product-hunt) recommends doing both.

- **How to launch week: Dub** — https://launchweek.dev/lw/n/dub.md — fetched 2026-11-09
  - "Day 1 may have the highest impact on social engagement" — Dub's own numbers (155K vs. 10K vs. 2K impressions across three days) back this directly.
  - "Pull in customers and partners as much as possible" — Dub's highest-engagement day featured named integration partners (Stripe, Clerk, Supabase) in the post and social copy.
  - "Post a recap of your announcements to keep the momentum going. This is good for SEO" — the explicit reason a recap page like `page:launch-week` is worth doing at all, beyond just linking the five posts.

- **Resend — How we keep momentum** — https://resend.com/handbook/marketing/how-we-keep-momentum — fetched 2026-11-09
  - Frames all content as a "Heartbeat": Launch Weeks (2–3x/year) are the big peaks, "Mini-Launches" and changelogs fill the gaps between them — useful framing for what VexCMS does *after* this launch week ends.
  - "We not only have to ship. We have to ship and talk about it." — stated as the core operating belief behind the whole framework, not a throwaway line.

- **Using launch blog posts to drive growth of developer products** — https://www.strategicnerds.com/blog/using-launch-blog-posts-to-drive-growth-of-developer-products — fetched 2026-11-09
  - Core thesis: "A launch blog post breaks through only if it teaches developers something new. Lead with help, not hype." — a "Help First" framing, contrasted against a plain feature-announcement outline that the author says won't break through unless the install base is already large.
  - Proposed outline for a post that *does* break through: brief intro above the fold → a short history of the problem → solutions people have tried (differentiation opportunity) → what the ideal solution looks like → introducing the feature → how it was built (engineering credibility) → how to get started.
  - Cites two real examples that reportedly hit #1 on Hacker News using this shape: Timescale's "How we made DISTINCT queries up to 8000x faster on PostgreSQL" and Neon's "Why does Neon use Paxos instead of Raft."

### Passive channels

- **This Week In React — Editorial line** — https://thisweekinreact.com/editorial-line — fetched 2026-11-09 — "We want to be the pulse of the React ecosystem, not a discovery tool for every React npm package" / explicitly filters "Product news… tied to a single vendor" and "Brand-new side projects" / "We don't cover their launch, but we might cover their v10 once it's mainstream."
- **DevHunt — Best CMS tools category page** — https://devhunt.org/tools/cms — fetched 2026-11-09 — confirms ranking is "by developer upvotes… all-time," sign-in required via GitHub or Google to vote, and that Strapi/Sanity/Contentful/Payload/Directus appear as **DevHunt-curated reference listings with 0 upvotes** (never organically launched/voted) — don't mistake those for ranked examples.
- **jamstack/jamstack.org — root README + merged PR precedent** — https://github.com/jamstack/jamstack.org and PR #1057 (https://github.com/jamstack/jamstack.org/pull/1057) — fetched 2026-11-09 — "We accept contributions submitted as pull requests"; LeadCMS's Feb 2026 merge confirms the current front-matter shape (`title, repo, homepage, twitter, opensource, typeofcms, supportedgenerators, description`) is still exactly what's expected, with no numeric eligibility gate.
- **unicodeveloper/awesome-nextjs — CONTRIBUTING.md** — https://raw.githubusercontent.com/unicodeveloper/awesome-nextjs/master/CONTRIBUTING.md — fetched 2026-11-06 (`sources.md` §5.7) — "Make an individual pull request for each suggestion" / "Use the following format: `[Title Case Name](link) - Description.`" / "Start the description with a capital and end with a full stop/period."

## hn:title

Slot purpose: Show HN title for the VexCMS launch post (the "Show HN: ..." headline itself).
Constraints: starts `Show HN: ` (§1.1); no site name, no uppercase or `!` for emphasis, no gratuitous number, don't editorialize (§1.2); no length limit quoted. Lint: `lint-slots.mjs` title-shape checks (spec step 7).

### Examples (ranked)
1. **Show HN: InstantDB – A Modern Firebase** — https://news.ycombinator.com/item?id=41322281 — 2024-08-22 — tier 1
   - Numbers: 1145 points / 297 comments, read 2026-11-09 from `hn.algolia.com/api/v1/items/41322281`
   - Opening line: "Hey there HN! We're Joe and Stopa, and today we're open sourcing InstantDB, a client-side database that makes it easy to build real-time and collaborative apps..."
   - Why it worked: title shape is `<Name> – A Modern <familiar product>` (38 chars, instantly legible) · hook is the one precise comparison word "Modern" implying what's fixed vs. the original · proof lives in-body (team of 5, ~2k commits, backing of Firebase's ex-CEO), not the title · demo/link placement: tutorial + GitHub both saved for the closing line · length 38 chars · tone first-person-plural, grateful · comments: makers (nezaj/stopachka) replied within minutes, went deep on technical comparisons (vs. Firebase, vs. PocketBase, datalog internals) and stayed humble rather than defensive.

2. **Show HN: ElectricSQL, Postgres to SQLite active-active sync for local-first apps** — https://news.ycombinator.com/item?id=37584049 — 2023-09-20 — tier 1
   - Numbers: 617 points / 170 comments, read 2026-11-09 from `hn.algolia.com/api/v1/items/37584049`
   - Opening line: "Hi HN, James, Valter, Sam and the team from ElectricSQL here."
   - Why it worked: title shape is `<Name>, <exact mechanism — what moves where>` (comma, not dash) · hook is precision over cleverness: no catchy tagline, just the literal data path · proof: n/a in the title itself · demo/link placement: n/a for title · length 80 chars (longest of the set, still reads as one clause) · tone flat and technical, zero adjectives · comments: four named team members answered quickly and technically across 170 comments.

3. **Show HN: PocketBase – Open Source realtime backend in one file** — https://news.ycombinator.com/item?id=32013330 — 2022-07-07 — tier 1
   - Numbers: 563 points / 111 comments, read 2026-11-09 from `hn.algolia.com/api/v1/items/32013330`
   - Opening line: n/a — title-only submission, no story text (see hn:text #5 for the consequence).
   - Why it worked: title shape is `<Name> – Open Source <category> in <striking constraint>` · hook is the single-binary constraint ("in one file") stated as the differentiator, not buried in a feature list · proof: none, by design — the constraint itself is the proof · demo/link placement: URL points straight at the GitHub repo, no landing page · length 62 chars · tone terse, no marketing language · comments: maker (randomwebdev) replied fast and specifically, but repeatedly had to explain "what does it even do" in the thread because no backstory text accompanied the title.

4. **Show HN: Appwrite – Open-Source and Self Hosted Firebase Alternative** — https://news.ycombinator.com/item?id=30769044 — 2022-03-22 — tier 1
   - Numbers: 326 points / 118 comments, read 2026-11-09 from `hn.algolia.com/api/v1/items/30769044`
   - Opening line: "Hey Hacker News, this is Christy from the Appwrite team"
   - Why it worked: title shape is `<Name> – Open-Source and Self Hosted <Known Product> Alternative`, the explicit "Alternative" comparison pattern · hook: names the exact competitor (Firebase) so category is instantly clear · proof: n/a in title; in-thread the founder backs it with "a single command installation" · demo/link placement: URL is the GitHub repo · length 68 chars · tone confident, not salesy · comments: founder (eldad_fux) personally fielded comparisons to Supabase and roadmap questions across 118 comments, answering directly ("Not yet, but it's coming soon").

5. **Show HN: I made a CMS that uses Git to store your data** — https://news.ycombinator.com/item?id=33306029 — 2022-10-23 — tier 1
   - Numbers: 203 points / 96 comments, read 2026-11-09 from `hn.algolia.com/api/v1/items/33306029`
   - Opening line: "I'm excited to finally launch Outstatic, an open source static website CMS that doesn't require a complicated setup or signing up to a third-party service!"
   - Why it worked: title shape has no product name at all — `I made a <category> that <mechanism>`, first-person and mechanism-led · hook: the storage mechanism ("uses Git") is the whole title · proof: n/a · demo/link placement: n/a for title · length 54 chars · tone personal, modest · comments: solo maker (AndreVitorio) answered 96 comments; notably this was his *second* Show HN for the same product — an earlier waitlist/landing-page teaser (`Show HN: Outstatic an open source CMS for Next.js`, id 32973903, 2022-09-25) scored only 4 points because there was nothing to try yet; this relaunch with a deployable example blog scored 203.

### Checklist
- Put the product name immediately after "Show HN:", then a dash or comma before the one-line description.
- Bake the single sharpest differentiator (a format, a deployment constraint, a storage mechanism) into the title itself rather than saving it for the body.
- Name a competing product in the title only when the comparison is precise and well-known (e.g. "Firebase Alternative"), not a vague buzzword.
- Keep the title to roughly 40–80 characters; cut filler words until only the clause remains.
- Avoid superlatives ("fastest," "best," "first"); let the specific mechanism or constraint do the selling.
- If there's no catchy framing yet, lead with plain first-person language ("I made a...") instead of forcing a comparison.
- Do not post a Show HN before there is something to actually try — a landing page or waitlist title will underperform a working-product title for the same project.

## hn:text

Slot purpose: the Show HN body text (or first comment, if submitting a bare URL) that accompanies the title.
Constraints: hand-written, no LLM generation or editing, "not even a tiny bit" (§1.4, §1.7); a clear statement of what it is plus backstory and what's different (§1.4); in the submission, or the first comment if it doesn't show (§1.4); easy to try without signups (§1.1); never solicit votes or comments (§1.2, §1.3). Links https://vexcms.dev (Design Decision 5).

### Examples (ranked)
1. **InstantDB — "Show HN: InstantDB – A Modern Firebase"** — https://news.ycombinator.com/item?id=41322281 — 2024-08-22 — tier 1
   - Numbers: 1145 points / 297 comments, read 2026-11-09 from `hn.algolia.com/api/v1/items/41322281`
   - Opening line: "Hey there HN! We're Joe and Stopa, and today we're open sourcing InstantDB, a client-side database that makes it easy to build real-time and collaborative apps..."
   - Why it worked: first sentence names the makers and gives a one-line description anchored to familiar apps (Notion, Figma) · backstory is two paragraphs — the "schleps" pain point, then "We were senior and staff engineers at Facebook and Airbnb," two years of essays, a team of 5, ~2k commits · what's-different section names precedents directly (Asana WorldStore, Figma LiveGraph, Linear sync) instead of just asserting novelty · try-it links (tutorial + GitHub) are held until the very last line, after the technical case is made · honest limitations: none stated — leans on borrowed credibility instead of admitted gaps · length ~550 words · ending: "We love feedback :)" plus numbered footnotes to their own essays.

2. **ElectricSQL — "Show HN: ElectricSQL, Postgres to SQLite active-active sync for local-first apps"** — https://news.ycombinator.com/item?id=37584049 — 2023-09-20 — tier 1
   - Numbers: 617 points / 170 comments, read 2026-11-09 from `hn.algolia.com/api/v1/items/37584049`
   - Opening line: "Hi HN, James, Valter, Sam and the team from ElectricSQL here."
   - Why it worked: first sentence is a flat team introduction, no hook sentence · backstory: skipped entirely — goes straight to what the system does · what's-different stated as plain facts ("CRDT-based," "resilient to conflicting edits," "works after being offline for extended periods"), no comparison framing · try-it placement: five links (website/docs/code/intro-post/demo-apps) bundled as a list immediately after two short paragraphs · honest limitations: none stated · length ~190 words, shortest of this sample · ending: closes on a credibility note, naming the two CRDT researchers on the team, rather than a feedback CTA.

3. **Triplit — "Show HN: Triplit – Open-source syncing database that runs on server and client"** — https://news.ycombinator.com/item?id=40788648 — 2024-06-25 — tier 1
   - Numbers: 279 points / 100 comments, read 2026-11-09 from `hn.algolia.com/api/v1/items/40788648`
   - Opening line: "Hey HN, we're Matt and Will, the co-founders of Triplit."
   - Why it worked: first sentence names founders + one-line description, with the install command given in paragraph two · backstory is a concrete pain narrative ("we've worked on several projects that aspired to the UX of Linear or Superhuman... had to implement a local caching strategy... individually handle retries") · what's-different explicitly names the tradeoff against other systems ("either sync all of a user's data... or repeatedly fetch the query") · try-it placement: install command appears early, full links repeated at the end · honest limitations stated openly — "In the future, we plan to add APIs for authentication, file uploads, and presence," flagging what's not built yet · length ~540 words · ending: closing links plus a direct feedback invite.

4. **Outstatic — "Show HN: I made a CMS that uses Git to store your data"** — https://news.ycombinator.com/item?id=33306029 — 2022-10-23 — tier 1
   - Numbers: 203 points / 96 comments, read 2026-11-09 from `hn.algolia.com/api/v1/items/33306029`
   - Opening line: "I'm excited to finally launch Outstatic, an open source static website CMS that doesn't require a complicated setup or signing up to a third-party service!"
   - Why it worked: first sentence states excitement + description + the single differentiator in one breath · backstory: skipped — no origin story at all · what's-different is only the one clause in the first sentence, never elaborated · try-it placement: "deploying our example blog to Vercel" is the very first call to action, ahead of the docs link · honest limitations stated directly — "This is the first public version of the project and all feedback is welcome" · length ~105 words, shortest in the set, almost comment-length · ending: a GitHub star ask plus thanks.

5. **PocketBase — "Show HN: PocketBase – Open Source realtime backend in one file" (no body text, counter-example)** — https://news.ycombinator.com/item?id=32013330 — 2022-07-07 — tier 1
   - Numbers: 563 points / 111 comments, read 2026-11-09 from `hn.algolia.com/api/v1/items/32013330`
   - Opening line: n/a — the post has no `story_text`; it's a bare link to the GitHub repo.
   - Why it worked (as a cautionary counter-example): first sentence n/a · backstory only surfaced later, buried in a reply to a commenter's direct question ("what was the motivation behind this project?") · what's-different was never stated proactively — a commenter wrote "I still don't understand what this project does. I wish I did" deep into the thread · try-it placement: the URL itself is the only link, no inline try-it path · honest limitations: n/a · length 0 words in the post body · ending: n/a — the thread spends multiple sub-threads with other commenters explaining the project to each other instead of discussing it. Despite this gap the post still did well on the strength of the constraint in the title and the maker's fast, substantive replies — but comments confirm the missing text cost clarity.

### Checklist
- Open with who's posting and a single jargon-free sentence describing what the thing is.
- Give a real, specific backstory — the exact pain that led to building it — not a generic "we noticed a gap."
- State plainly what's different from existing tools, naming the alternatives rather than implying superiority.
- Put a try-it path (install command, deployed example, or repo link) in the body early, and repeat it at the end.
- State openly what isn't built yet or is a known limitation; admitted gaps read as more credible than silence.
- Keep the post in roughly the 100–600 word range; a short bullet list of links can substitute for prose where the product needs no comparison framing.
- Never submit with only a bare repo URL and no accompanying text or first comment — the thread will spend its early replies asking what the thing does instead of giving feedback on it.
- Close with a specific, direct invitation for feedback rather than a generic sign-off.

## ph:name

Slot purpose: the bare product name field on the PH submission form — "Just the product's name. No taglines or emoji" (help.producthunt.com, §2.3, already in sources.md).
Constraints: ≤ 40 characters, just the name, no tagline or emoji (§2.3); personal maker account, not a brand (§2.1, §2.6).

### Examples (ranked)
1. **Appwrite** — https://www.producthunt.com/products/appwrite/launches/appwrite-2 — Sept 21, 2022 — tier 1
   - Numbers: 906 upvotes / 551 comments, #1 Product of the Day, read 2026-11-09 from hunted.space/dashboard/appwrite/launches/appwrite-2 (PH-sourced mirror)
   - Opening line: n/a (name field only)
   - Why it worked: title shape · bare brand name, 8 chars, no suffix · hook n/a · proof n/a · demo/link placement n/a · length minimal · tone neutral · comments: maker (Eldad Fux) engaged heavily given 551-comment thread
2. **Convex** — https://www.producthunt.com/products/convex/launches/convex — undated (submitted, not featured) — tier 1
   - Numbers: 62 upvotes / 28 comments, #54 on the daily leaderboard (not Product of the Day), read 2026-11-09 from hunted.space/dashboard/convex/launches/convex
   - Opening line: n/a (name field only)
   - Why it worked: title shape · bare 6-char brand name, no "Convex CMS"/"Convex.dev" suffix · hook n/a · proof n/a · demo/link n/a · length minimal · tone neutral · comments: maker (Jamie, co-founder) wrote the full first comment personally (see ph:maker-comment #1)
3. **PocketBase** — https://www.producthunt.com/products/pocketbase — July 8, 2022 — tier 1
   - Numbers: 114 upvotes / 6 comments, #22, read 2026-11-09 from hunted.space/dashboard/351816
   - Opening line: n/a
   - Why it worked: title shape · bare product name, no tagline appended · low comment count shows name alone didn't need explaining · hook n/a · demo/link n/a · tone neutral · comments: n/a (hunted by Product Hunt staff account, not the maker)
4. **Payload CMS** — https://www.producthunt.com/products/payload-cms/launches/payload-cms — May 12, 2021 — tier 1
   - Numbers: 136 upvotes / 25 comments, #11, read 2026-11-09 from hunted.space/dashboard/295370
   - Opening line: n/a
   - Why it worked: title shape · includes category word "CMS" in the name itself (11 chars) rather than leaving it to the tagline · hook n/a · proof n/a · demo/link n/a · tone neutral · comments: hunted by a well-known third party (Wes Bos), not self-hunted
5. **Directus 9** — https://www.producthunt.com/products/directus/launches/directus-9 — Dec 7, 2021 — tier 1
   - Numbers: 334 upvotes / 316 comments, #2 Product of the Day, read 2026-11-09 from hunted.space/dashboard/directus/launches/directus-9
   - Opening line: n/a
   - Why it worked: title shape · version-number suffix ("9") on a re-launch of an existing product, distinct from the bare "Directus" product page name · hook n/a · demo/link n/a · tone neutral · comments: CEO (Ben) personally answered in the 316-comment thread (see ph:maker-comment #2)

### Checklist
- Use the bare product name only; do not append a category word, tagline, or emoji to the name field.
- For a version/re-launch (e.g. "Directus 9"), the launch name may carry a version suffix even though the permanent product page keeps the bare name — decide once and stay consistent for the 0.1.0 launch (bare "VexCMS" vs. a suffixed variant) without drafting copy here.
- A short, pronounceable name (6–11 chars in every example above) leaves the full 40-character budget unused — don't pad it.

---

## ph:tagline

Slot purpose: "Say exactly what the product does. Skip hype like 'the best' or '#1'" (help.producthunt.com, §2.3, already in sources.md).
Constraints: ≤ 60 characters, says exactly what it does, no hype ("the best", "#1") (§2.3); PH doesn't feature templates or boilerplates, so frame a working CMS (§2.8).

### Examples (ranked)
1. **Appwrite — "100% open source alternative for Firebase"** — https://www.producthunt.com/products/appwrite/launches/appwrite-2 — Sept 21, 2022 — tier 1
   - Char count: 43/60
   - Numbers: 906 upvotes / 551 comments, #1 Product of the Day, read 2026-11-09 from hunted.space
   - Opening line: n/a (tagline, not post body)
   - Why it worked: title shape · names the exact incumbent it displaces ("alternative for Firebase") instead of a generic category claim · hook is the "100%" qualifier (factual, not hype, since it's literally fully open source) · proof is implicit in the open-source claim · length 43/60, leaves room unused · tone factual · comments: n/a
2. **Directus 9 — "Instant no-code app and dynamic API for any SQL database"** — https://www.producthunt.com/products/directus/launches/directus-9 — Dec 7, 2021 — tier 1
   - Char count: 56/60 (sources.md §2.3 cites this exact 60-char ceiling)
   - Numbers: 334 upvotes / 316 comments, #2, read 2026-11-09 from hunted.space
   - Opening line: n/a
   - Why it worked: title shape · stacks two value claims ("no-code app and dynamic API") joined by "and" to cover both audiences (no-code users + API consumers) · hook is "Instant" · proof is the concrete scope ("any SQL database") · length near the 60-char ceiling, dense · tone factual · comments: n/a
3. **Convex — "A better type of backend"** — https://www.producthunt.com/products/convex/launches/convex — tier 1
   - Char count: 24/60
   - Numbers: 62 upvotes / 28 comments, #54, read 2026-11-09 from hunted.space
   - Opening line: n/a
   - Why it worked: title shape · deliberately vague comparative ("better type of") rather than naming a feature — PH's own guidance flags vague taglines as a liability (see Guides §1 below), and this is the lowest-ranking example in this set, consistent with that warning · hook is the comparison · proof absent from the tagline itself (pushed to the description/maker comment) · length minimal · tone casual · comments: n/a
4. **PocketBase — "Open Source realtime backend in 1 file"** — https://www.producthunt.com/products/pocketbase — July 8, 2022 — tier 1
   - Char count: 39/60
   - Numbers: 114 upvotes / 6 comments, #22, read 2026-11-09 from hunted.space
   - Opening line: n/a
   - Why it worked: title shape · ends on a concrete, almost startling constraint ("in 1 file") that doubles as the product's main differentiator · hook is that closing detail · proof is the specificity itself · length 39/60 · tone factual · comments: n/a
5. **Payload CMS — "Developer-first TypeScript & React headless CMS"** — https://www.producthunt.com/products/payload-cms/launches/payload-cms — May 12, 2021 — tier 1
   - Char count: 47/60
   - Numbers: 136 upvotes / 25 comments, #11, read 2026-11-09 from hunted.space
   - Opening line: n/a
   - Why it worked: title shape · stacks three qualifiers (audience "developer-first", stack "TypeScript & React", category "headless CMS") in one clause · hook is "developer-first" as the lead word · proof is the named stack · length 47/60 · tone factual · comments: n/a

### Checklist
- Fit comfortably under 60 chars (examples range 24–56); don't treat the ceiling as a target.
- Lead with either the category + differentiator ("X alternative for Y", "no-code app and dynamic API for Z") or a single concrete, checkable detail ("in 1 file") — avoid pure comparative hype ("a better type of X") with no specific that backs it up.
- Name the exact incumbent/category being displaced when there is one (Firebase, SQL databases) rather than a generic claim.
- Confirm final character count before submitting; PH enforces the limit at the form level.

---

## ph:description

Slot purpose: "Lead with the value, then the features that deliver it" (help.producthunt.com, §2.3, already in sources.md; confirmed again 2026-11-09 via https://help.producthunt.com/en/articles/17734341-2-what-kind-of-products-get-featured, which adds: "Say what the product does so someone gets it on the first read.").
Constraints: ≤ 500 characters, value first, then the features that deliver it (§2.3).

### Examples (ranked)
1. **Dub.co** — https://www.producthunt.com/posts/dub — March 21, 2024 — tier 2 (same-platform dev tool, not CMS/BaaS)
   - Char count: 253/500
   - Numbers: 1,085 upvotes / 210 comments, #1 Product of the Day / Week / Month, read 2026-11-09 from the founder's own account at https://dub.co/blog/product-hunt (primary source: Steven Tey, founder & CEO)
   - Opening line: "Dub.co is the link management platform for modern marketing teams."
   - Why it worked: structure is value-first sentence, then a one-line category reframe ("open-source Bitly successor"), then named social proof ("Framer, Raycast, Perplexity") · length 253/500, roughly half budget used · tone factual, no feature list · comments: founder's own writeup states this post was "largely adapted from our teaser page," i.e. reused validated copy rather than written fresh on launch day
2. **Directus 9** — https://www.producthunt.com/products/directus/launches/directus-9 — Dec 7, 2021 — tier 1
   - Char count: 256/500
   - Numbers: 334 upvotes / 316 comments, #2, read 2026-11-09 from hunted.space
   - Opening line: "Directus turns any SQL database into a no-code app and powerful API."
   - Why it worked: structure is value sentence first ("turns any SQL database into..."), then the differentiator ("migration-free, seamlessly layering on top of your... database") · length 256/500 · tone factual · comments: n/a
3. **Convex** — https://www.producthunt.com/products/convex/launches/convex — tier 1
   - Char count: 256/500
   - Numbers: 62 upvotes / 28 comments, #54, read 2026-11-09 from hunted.space
   - Opening line: "Convex is a full-stack TypeScript development platform that keeps you focused on your product."
   - Why it worked: structure is value sentence, then two feature sentences (realtime database; AI/vector-search integration) · length 256/500 · tone factual, but second sentence trends feature-first rather than value-first, worth noting as the weaker half of this example
4. **PocketBase** — https://www.producthunt.com/products/pocketbase — July 8, 2022 — tier 1
   - Char count: 246/500
   - Numbers: 114 upvotes / 6 comments, #22, read 2026-11-09 from hunted.space
   - Opening line: "PocketBase is an open source Go backend that has embedded realtime database, files and users management, admin UI and REST-ish API, all compiled in 1 portable executable."
   - Why it worked: structure is a single dense feature-list sentence, then a one-line competitive frame ("think of it as a lightweight alternative to Firebase or Supabase") placed last, not first · length 246/500 · tone factual · comments: n/a — included despite leading with a feature list (not strictly value-first) because the closing comparison line is a strong, quotable pattern
5. **Payload CMS** — https://www.producthunt.com/products/payload-cms/launches/payload-cms — May 12, 2021 — tier 1
   - Char count: 239/500
   - Numbers: 136 upvotes / 25 comments, #11, read 2026-11-09 from hunted.space
   - Opening line: "Payload is a TypeScript headless CMS built to catapult your efficiency as a developer."
   - Why it worked: structure is value sentence naming the exact beneficiary ("your efficiency as a developer"), then concrete feature list (REST/GraphQL/Node APIs + admin panel) · length 239/500, under half budget · tone factual · comments: n/a

### Checklist
- Open with a single sentence naming the product + the value it delivers, not a feature list; push features to sentence two.
- Use well under the 500-char ceiling (all five examples land 239–256 chars) — PH's own guidance only requires "lead with value," not maximal length.
- A named-competitor comparison ("alternative to Firebase or Supabase", "open-source Bitly successor") works best as the closing line, after the value statement, not the opening line.
- Named social proof (specific company names) is optional but appeared in the highest-ranked example (Dub.co).

---

## ph:maker-comment

Slot purpose: the pinned first comment the maker posts at launch — PH's own glossary defines it as "the first comment on a launch, written by the maker" (help.producthunt.com, article 8, read 2026-11-09, §1 below); sources.md §2.3 already records the 5,000-char ceiling.
Constraints: ≤ 5,000 characters, posted and pinned at launch (§2.3); ask people to try it and give feedback, never to upvote (§2.4, §2.7).

### Examples (ranked)
1. **Convex — Jamie (co-founder)** — https://www.producthunt.com/products/convex/launches/convex — tier 1
   - Numbers: 62 upvotes / 28 comments total on the launch, read 2026-11-09 from hunted.space/dashboard/convex/launches/convex (full comment text mirrored there)
   - Opening line: "Hey everyone! I'm Jamie, one of the creators of Convex."
   - Why it worked: structure is who-I-am (1 sentence) → backstory of the problem the founders personally hit at past jobs ("we managed backend platforms that desperately tried to keep up...") → the belief that motivated the product → a 6-item bullet list of what's shipped → closing ask: "We'd love everyone's thoughts and suggestions as we continue to ship." · never asks for upvotes · tone is personal, first-person plural, no marketing adjectives · length is the longest of this set (roughly 1,400 chars) but stays well under the 5,000 ceiling
2. **Directus 9 — Ben (CEO)** — https://www.producthunt.com/products/directus?launch=directus-9 — Dec 7, 2021 — tier 1
   - Numbers: 334 upvotes / 316 comments, read 2026-11-09 via indexed PH snippet (full comment not retrievable past the opening — PH product pages 403 on direct fetch; opening line below is the only portion confirmed verbatim)
   - Opening line: "Hi Product Hunt... Ben here, CEO of Directus 👋 Years ago, we built Directus because every project started the same way: a database full of data and..."
   - Why it worked (confirmed portion only): structure opens identically to Convex's pattern — name + role in sentence one, then an origin-story sentence framed around a concrete recurring pain ("every project started the same way") · tone personal, informal greeting + emoji · rest of structure [UNVERIFIED — PH comment thread blocked at HTTP 403 on direct fetch; only the search-engine-indexed opening sentence was recoverable]
3. **Dub.co — Steven Tey (founder & CEO)** — https://www.producthunt.com/posts/dub — March 21, 2024 — tier 2
   - Numbers: 1,085 upvotes / 210 comments total on the launch; the first comment itself "ended up becoming the most upvoted comment on our launch post" per the founder's own account, read 2026-11-09 from https://dub.co/blog/product-hunt — exact upvote count on the comment itself is [UNVERIFIED — the blog post states the superlative but doesn't give the comment's own vote count, and the PH thread could not be fetched directly (403)]
   - Opening line: [UNVERIFIED — dub.co/blog/product-hunt describes the comment's structure and impact but the verbatim text renders as an embedded widget not captured by a text fetch]
   - Why it worked (per the founder's own description): structure is "thoughtful but concise," and "shares a compelling & personal reason about why you decided to build this product" · scheduled in advance of the 12:01 AM launch so it posts immediately, not written live · tone: founder explicitly frames it as the opposite of marketing copy
4. **Supabase — Paul Copplestone (CEO/co-founder), AMA thread (not the original launch comment)** — https://www.producthunt.com/p/supabase/ama-w-supabase-ceo — tier 1
   - Numbers: 1.8K views, 27/40 reaction counts shown on the thread per the indexed snippet, read 2026-11-09 — this is a later community AMA thread, not the 2020 launch's pinned maker comment, so treat as a tone reference only, not a maker-comment structure example
   - Opening line: "everyone, i'm the ceo/cofounder of supabase we're big fans of PH and the community here - you've been amazing at giving us feedback and helping us dev..."
   - Why it worked: tone is deliberately lowercase/informal, names the role in sentence one (same convention as #1 and #2 above), explicitly credits the community before asking anything · context caveat: this is a different thread type (AMA, not launch-day first comment) — included only to confirm the same "who I am" opening convention recurs outside the launch thread itself

### Checklist
- Open with first name + role in one sentence ("I'm Jamie, one of the creators of Convex" / "Ben here, CEO of Directus").
- Follow with the real originating problem the maker personally hit, not a feature pitch.
- Use a short bullet list (Convex: 6 bullets) for what's shipped/available, not prose paragraphs, if listing features.
- Close with an invitation for feedback/questions — never a request for upvotes (Convex: "We'd love everyone's thoughts and suggestions"; this also satisfies PH's anti-upvote-solicitation rule already recorded in sources.md §2.4/§2.7).
- Schedule the comment to post at the 12:01 AM launch moment rather than writing it live (Dub.co's documented practice).
- Keep well under the 5,000-char ceiling — the longest confirmed example (Convex) runs roughly 1,400 characters.

---

## ph:tags

Slot purpose: "Add launch tags (required, up to 3)" (help.producthunt.com, §2.3, already in sources.md).
Constraints: required, up to 3 launch tags (§2.3); pricing Free and the open-source repo link are separate fields.

### Examples (ranked)
1. **Resend Inboxes** — API · Email · Developer Tools — https://www.producthunt.com/products/resend — Oct 22, 2026 — tier 1 (email/dev-infra, closest-dated confirmation the 3-tag cap is still enforced)
   - Numbers: 121 upvotes / 7 comments, #10 Product of the Day, read 2026-11-09 from hunted.space/dashboard/resend
   - Opening line: n/a
   - Why it worked: title shape n/a · tag choice stacks category (Email) + mechanism (API) + audience (Developer Tools) in exactly 3 slots, confirming the current cap is 3 even in a recent (Oct 2026) launch
2. **Directus 9** — API · Open Source · Developer Tools — https://www.producthunt.com/products/directus/launches/directus-9 — Dec 7, 2021 — tier 1
   - Numbers: 334 upvotes / 316 comments, #2, read 2026-11-09 from hunted.space
   - Why it worked: 3 tags covering mechanism (API), license model (Open Source), audience (Developer Tools) — same 3-axis pattern as Resend above
3. **Convex** — Developer Tools · Tech · Database — tier 1
   - Numbers: 62 upvotes / 28 comments, #54, read 2026-11-09 from hunted.space
   - Why it worked: 3 tags covering audience (Developer Tools), broad category (Tech), and the specific product category (Database)
4. **Payload CMS** — Web App · Marketing · Developer Tools · Tech — https://www.producthunt.com/products/payload-cms/launches/payload-cms — May 12, 2021 — tier 1
   - Numbers: 136 upvotes / 25 comments, #11, read 2026-11-09 from hunted.space
   - Why it worked: [NOTE] this launch shows 4 topics, not 3 — either the 3-tag cap wasn't yet enforced in 2021 or "topics" and "launch tags" were separate concepts at that time; excluded from the "current rule" checklist item below but kept as a historical data point since Payload is otherwise the closest CMS comparable
5. **Appwrite** — Open Source · Developer Tools · GitHub · Tech — https://www.producthunt.com/products/appwrite/launches/appwrite-2 — Sept 21, 2022 — tier 1
   - Numbers: 906 upvotes / 551 comments, #1, read 2026-11-09 from hunted.space
   - Why it worked: same 4-tag pattern as Payload CMS above (2022 launch) — another data point suggesting the strict 3-tag cap is a more recent rule change, not something to rely on for pre-2023 launches

### Checklist
- Current PH submissions (2026) enforce exactly ≤3 launch tags (Resend confirms this); don't assume older launches showing 4 tags (Payload CMS 2021, Appwrite 2022) still reflect the live form.
- Pick 3 tags spanning different axes rather than 3 synonyms: mechanism/category (API, Database), license model (Open Source), and audience (Developer Tools) is the recurring 3-axis pattern across Resend, Directus, and Convex.
- Check the live PH topic list at submission time rather than reusing an older launch's exact tag set, since available topics change (sources.md §2.3 already flags this as a pre-launch task).

---

## linkedin:d1

Slot purpose: launch-day announcement post with a native silent-friendly demo clip, linking out to the announcement blog post.
Constraints: no official length or link-card limit found (§5.17, [UNVERIFIED]); the day's clip is a native upload, silent, so the post text describes what it shows (Design Decision 11); link the day's canonical URL in the body.

### Examples (ranked)
1. **Zeno Rocha (Resend) — "today, we're launching Resend Inboxes... we're also launching Forge."** — https://www.linkedin.com/posts/zenorocha_today-were-launching-resend-inboxes-an-activity-7518715636206764033-YWts — posted ~2w before read (≈ late Oct 2026) — tier 2 (same-platform dev infra, not a CMS)
   - Numbers: 272 reactions, 32 comments, read 2026-11-09 directly from the LinkedIn post page
   - Opening line: "today, we're launching Resend Inboxes. an inbox for people and their agents."
   - Why it worked: title shape — no title, just a lowercase present-tense declaration · hook — states the launch in the first 4 words, before the "…more" cut · no native clip on this one (link-card only), proving copy alone can carry a bundle launch · link placed inline right after each product's bullet list, not held back · length — two short launches stacked with a visual paragraph break between them · tone — all-lowercase, no exclamation points, confident understatement · comments — Zeno replies personally to the skeptical "bold move 👀" comment rather than ignoring it, and later a separate comment thread shows him owning even self-critical remarks about the company.

2. **Paul Copplestone (Supabase) — "It's Supabase Launch Week. Yesterday we launched Supabase AI... Day 3 of Launch Week..."** — https://www.linkedin.com/posts/paulcopplestone_its-supabase-launch-week-yesterday-we-launched-activity-7095347969490657280-GS-Y — ~39mo before read (≈ Aug 2023, estimated) — tier 1 (same-platform BaaS/dev-tool launch week)
   - Numbers: 124 reactions, 7 comments, read 2026-11-09 directly from the LinkedIn post page
   - Opening line: "It's Supabase Launch Week. Yesterday we launched Supabase AI, my favourite feature so far — also on Product Hunt today:"
   - Why it worked: title shape — states the recurring event ("Launch Week") then the specific day's feature · hook — personal enthusiasm cue ("my favourite feature so far") before the cut · **native video** — the post has a full auto-generated transcript, confirming an uploaded clip rather than an external YouTube link, and the clip is a silent-readable screen-recording walkthrough (on-screen UI changes carry the story even without audio) · link placement — Product Hunt link mid-post, "full announcement" link held for the end · length — one-line hook + a tight 6-item bullet list of sub-features · tone — first person, casual · comments — Paul replies once, to his own post, pointing at one specific sub-feature ("the schema visualizer is worth checking out") instead of a generic thank-you.

3. **Paul Copplestone (Supabase) — "Every few months, Supabase does a 'Launch Week'... In ~2 weeks we're doing our biggest yet: Launch Week X"** — https://www.linkedin.com/posts/paulcopplestone_every-few-months-supabase-does-a-launch-activity-7135649105879465984-8Ma_ — ~35mo before read (≈ Dec 2023, estimated) — tier 1
   - Numbers: 126 reactions, 5 comments, read 2026-11-09 directly from the LinkedIn post page
   - Opening line: "Every few months, Supabase does a \"Launch Week\" where we ship a major feature every day for a week. In ~2 weeks we're doing our biggest yet: Launch Week X"
   - Why it worked: this is the *overview/trailer* post, not a feature-day post — useful as the structural twin of a "day 1" announcement · hook explains the recurring format before the specific ask, for readers who've never seen one · tagged as a video post in search indexing (countdown/trailer style, not a feature demo) · link repeated at open and close, both pointing to the same signup page · length — 3-bullet "rough sequence of events" list · tone — casual and self-deprecating ("We spent about 1 hour debating…") · comments — no founder reply visible, but one commenter posts their own referral/ticket link unprompted — a sign the post is designed to spawn shareable artifacts, not just likes.

4. **James Mikrut (Payload) — "🔥 PAYLOAD CLOUD IS LIVE!"** — https://www.linkedin.com/posts/james-mikrut-3202985a_payload-cloud-is-live-activity-7048667132678590467-YofY — ~43mo before read (≈ Apr 2023, estimated) — tier 1 (headless CMS, direct competitor category)
   - Numbers: 79 reactions, 14 comments, read 2026-11-09 directly from the LinkedIn post page
   - Opening line: "🔥 PAYLOAD CLOUD IS LIVE!"
   - Why it worked: title shape — all-caps one-line punch with a single emoji, maximally scannable · hook — the entire first line is the news, no preamble · search indexing tags this post as containing video, and the same content is echoed by the **company page** post embedded beneath it — a dual-channel personal+company amplification pattern · link on line 2, explanation paragraph after · length — 3 short sentences total · tone — high-energy, exclamation-heavy · comments — James doesn't personally reply, but the thread fills with one-word/emoji congratulations from other known builders (e.g. Ruben Fiszel) — shows founder-network cross-engagement doing real work, not just organic reach.

5. **Paul Copplestone (Supabase) — "Introducing the new Supabase Vector Toolkit..."** — https://www.linkedin.com/posts/paulcopplestone_supabase-vector-the-postgres-vector-database-activity-7069800988135624704-5rHN — ~41mo before read (≈ Jun 2023, estimated) — tier 1
   - Numbers: 263 reactions, 14 comments, read 2026-11-09 directly from the LinkedIn post page
   - Opening line: "Introducing the new Supabase Vector Toolkit, an open source suite for building AI applications and managing vectors/embeddings"
   - Why it worked: **no native clip** — a plain link-preview card — yet pulled the highest reaction count of all five examples, proof a tight bullet list can outperform a flashier format · title shape leads with "open source" framing, a credibility signal for this audience · 4 diamond-bullets, one link, 3 hashtags at the very end · length — shortest post of the five · tone — flat, zero hype adjectives · comments — mixed technical questions (pgvector vs. dedicated vector DBs) sit unanswered in the visible window — a reminder that even strong posts don't need every comment answered, but a founder reply elsewhere in the thread tree still shows up once ("the speed of innovation... is insane" thread has a like from Paul).

### Checklist
- Put the version/launch-week context and the specific day's headline in the first ~2 lines, before LinkedIn's "…see more" cutoff.
- Upload the demo clip natively (not a YouTube/Loom link) — check for an auto-generated transcript as the signal LinkedIn is treating it as a native video.
- Make the clip readable muted: let on-screen UI changes tell the story since most feeds autoplay without sound.
- Place the primary link once, not at the very top of the post — bullets or product description can come first.
- Keep the body to one hook line plus a short bullet list; avoid multi-paragraph prose.
- Reply to at least one real comment with a specific detail (not "thanks!") within the first day.

---

## linkedin:d2

Slot purpose: day-2 feature post — real-time admin panel + live preview — native clip + link.
Constraints: no official length or link-card limit found (§5.17, [UNVERIFIED]); the day's clip is a native upload, silent, so the post text describes what it shows (Design Decision 11); link the day's canonical URL in the body.

### Examples (ranked)
1. **Paul Copplestone (Supabase) — Day 3 Launch Week / Supabase AI post** — https://www.linkedin.com/posts/paulcopplestone_its-supabase-launch-week-yesterday-we-launched-activity-7095347969490657280-GS-Y — ≈ Aug 2023 (estimated) — tier 1
   - Numbers: 124 reactions, 7 comments, read 2026-11-09
   - Opening line: "It's Supabase Launch Week. Yesterday we launched Supabase AI, my favourite feature so far — also on Product Hunt today:"
   - Why it worked for a "watch it update live" feature: the native clip is a continuous screen recording of one workflow (write SQL → see diff view → accept/run) with no cuts — the exact shape needed to show an admin panel and a live preview reacting to each other in real time · the bullet list under the clip names every sub-feature shown in the video, so skimmers who don't press play still get the list · founder reply stays narrowly on-topic (pointed at the schema visualizer, a visual/UI feature, matching this slot's subject).

2. **James Mikrut (Payload) — "Payload Cloud is live"** — https://www.linkedin.com/posts/james-mikrut-3202985a_payload-cloud-is-live-activity-7048667132678590467-YofY — ≈ Apr 2023 (estimated) — tier 1
   - Numbers: 79 reactions, 14 comments, read 2026-11-09
   - Opening line: "🔥 PAYLOAD CLOUD IS LIVE!"
   - Why it worked: shows that even a platform/infrastructure feature (not visibly "live" on screen) can be posted with a short clip if the explanation sentence makes the before/after concrete ("Connect your GitHub repo and boom—get a… database, S3 file storage, email, and app deployment instantly") · useful model for framing an admin-panel feature in one causal sentence rather than a spec list.

3. **Zeno Rocha (Resend) — Inboxes/Forge launch** — https://www.linkedin.com/posts/zenorocha_today-were-launching-resend-inboxes-an-activity-7518715636206764033-YWts — ≈ late Oct 2026 — tier 2
   - Numbers: 272 reactions, 32 comments, read 2026-11-09
   - Opening line: "today, we're launching Resend Inboxes. an inbox for people and their agents."
   - Why it worked for this slot: the two bullets under each product name read like UI capabilities a screenshot/clip could show directly ("agents and humans reply from the same thread") — a reusable pattern for turning an admin-panel capability into two bullet lines instead of a paragraph.

4. **Paul Copplestone (Supabase) — Launch Week X overview post** — https://www.linkedin.com/posts/paulcopplestone_every-few-months-supabase-does-a-launch-activity-7135649105879465984-8Ma_ — ≈ Dec 2023 (estimated) — tier 1
   - Numbers: 126 reactions, 5 comments, read 2026-11-09
   - Why it worked: least on-topic of the four for a feature-specific day, included for contrast — shows what happens when a post stays abstract (no concrete feature named) instead of showing one workflow; reactions are similar but comments are thinner and less technical.

5. **Paul Copplestone (Supabase) — Supabase Vector post** — https://www.linkedin.com/posts/paulcopplestone_supabase-vector-the-postgres-vector-database-activity-7069800988135624704-5rHN — ≈ Jun 2023 (estimated) — tier 1
   - Numbers: 263 reactions, 14 comments, read 2026-11-09
   - Why it worked: highest-performing of the pool despite no native clip — a reminder that if the clip isn't ready in time, a crisp bullet list with one link still works for this slot.

### Checklist
- Film one continuous workflow (edit → live preview reacts) rather than cutting between multiple features.
- Caption every UI change shown in the clip in the post's bullet list, for muted/no-play viewers.
- Frame the admin-panel capability as one cause→effect sentence before listing sub-points.
- If the clip isn't ready, a 4-bullet list + single link is an acceptable fallback (see Supabase Vector).

---

## linkedin:d3

Slot purpose: day-3 feature post — one config → Convex schema + generated types — native clip + link.
Constraints: no official length or link-card limit found (§5.17, [UNVERIFIED]); the day's clip is a native upload, silent, so the post text describes what it shows (Design Decision 11); link the day's canonical URL in the body.

### Examples (ranked)
1. **Paul Copplestone (Supabase) — Supabase Vector post** — https://www.linkedin.com/posts/paulcopplestone_supabase-vector-the-postgres-vector-database-activity-7069800988135624704-5rHN — ≈ Jun 2023 (estimated) — tier 1
   - Numbers: 263 reactions, 14 comments, read 2026-11-09
   - Opening line: "Introducing the new Supabase Vector Toolkit, an open source suite for building AI applications and managing vectors/embeddings"
   - Why it worked for a code/types feature: this is the most "infra-plumbing" of the five posts (a Python library + integrations, nothing visually flashy) and it's the top performer — proves a dry, technical capability doesn't need a demo clip if the bullet list states exactly what you get ("Vecs: a Python lib for managing collections…") · title leads with "open source," the credibility signal that matters most to a technical reader deciding whether to trust a type-generation claim.

2. **Paul Copplestone (Supabase) — Day 3 / Supabase AI post** — https://www.linkedin.com/posts/paulcopplestone_its-supabase-launch-week-yesterday-we-launched-activity-7095347969490657280-GS-Y — ≈ Aug 2023 (estimated) — tier 1
   - Numbers: 124 reactions, 7 comments, read 2026-11-09
   - Why it worked for this slot: the clip shows a generated artifact (SQL) being produced, reviewed in a diff view, and run — structurally identical to "write one config block, watch types/schema get generated and diffed."

3. **James Mikrut (Payload) — "Payload Cloud is live"** — https://www.linkedin.com/posts/james-mikrut-3202985a_payload-cloud-is-live-activity-7048667132678590467-YofY — ≈ Apr 2023 (estimated) — tier 1
   - Numbers: 79 reactions, 14 comments, read 2026-11-09
   - Why it worked: the "connect repo and boom" causal sentence is a reusable template for "write config and boom — schema + types exist."

4. **Zeno Rocha (Resend) — Inboxes/Forge launch** — https://www.linkedin.com/posts/zenorocha_today-were-launching-resend-inboxes-an-activity-7518715636206764033-YWts — ≈ late Oct 2026 — tier 2
   - Numbers: 272 reactions, 32 comments, read 2026-11-09
   - Why it worked: a commenter's technical question ("Is there a lock or a draft handoff?") shows this audience will dig into mechanism questions — a config/types feature post should pre-empt the obvious "what happens on conflict/drift?" question in the body or be ready for it in comments.

5. **Paul Copplestone (Supabase) — Launch Week X overview post** — https://www.linkedin.com/posts/paulcopplestone_every-few-months-supabase-does-a-launch-activity-7135649105879465984-8Ma_ — ≈ Dec 2023 (estimated) — tier 1
   - Numbers: 126 reactions, 5 comments, read 2026-11-09
   - Why it worked: weakest fit, included for contrast — abstract/no-artifact posts draw less technical engagement than posts that show a concrete generated output.

### Checklist
- Lead the bullet list with what is generated (schema, types) stated as a noun, not a verb phrase.
- If showing a clip, include the "write config → generated output" sequence end-to-end, not just the config step.
- State the credibility signal relevant to type-safety claims early (e.g., open-source, testable) in the opening line.
- Anticipate one mechanism question (drift, conflicts, regeneration) in the body or be ready to answer it fast in comments.

---

## linkedin:d4

Slot purpose: day-4 feature post — RBAC + server-enforced hooks/validation — native clip + link.
Constraints: no official length or link-card limit found (§5.17, [UNVERIFIED]); the day's clip is a native upload, silent, so the post text describes what it shows (Design Decision 11); link the day's canonical URL in the body.

### Examples (ranked)
1. **Paul Copplestone (Supabase) — Day 3 / Supabase AI post (mentions "Role Management")** — https://www.linkedin.com/posts/paulcopplestone_its-supabase-launch-week-yesterday-we-launched-activity-7095347969490657280-GS-Y — ≈ Aug 2023 (estimated) — tier 1
   - Numbers: 124 reactions, 7 comments, read 2026-11-09
   - Opening line: "It's Supabase Launch Week. Yesterday we launched Supabase AI, my favourite feature so far — also on Product Hunt today:"
   - Why it worked for this slot: "Role Management" sits in the same bullet list as five other dashboard features without being singled out or over-explained — security/permissions features can ride inside a normal feature list rather than needing a separate "trust us" framing.

2. **Zeno Rocha (Resend) — Inboxes/Forge launch** — https://www.linkedin.com/posts/zenorocha_today-were-launching-resend-inboxes-an-activity-7518715636206764033-YWts — ≈ late Oct 2026 — tier 2
   - Numbers: 272 reactions, 32 comments, read 2026-11-09
   - Why it worked: a commenter directly raised a trust/safety concern ("Launching its own MTA was a very BOLD move 👀") and Zeno's tone stayed calm and non-defensive in the thread — the model for how to handle a skeptical security-adjacent comment on an RBAC/validation post.

3. **Paul Copplestone (Supabase) — Supabase Vector post** — https://www.linkedin.com/posts/paulcopplestone_supabase-vector-the-postgres-vector-database-activity-7069800988135624704-5rHN — ≈ Jun 2023 (estimated) — tier 1
   - Numbers: 263 reactions, 14 comments, read 2026-11-09
   - Why it worked: no overclaiming language anywhere in the post — purely descriptive bullets — the right register for a claim like "server-enforced," which reads as marketing fluff if adjectives are added.

4. **James Mikrut (Payload) — "Payload Cloud is live"** — https://www.linkedin.com/posts/james-mikrut-3202985a_payload-cloud-is-live-activity-7048667132678590467-YofY — ≈ Apr 2023 (estimated) — tier 1
   - Numbers: 79 reactions, 14 comments, read 2026-11-09
   - Why it worked: weak fit for this slot specifically (no RBAC content), included because the founder-network comment pattern (other builders vouching in the thread) is a useful trust signal for a security-adjacent feature too.

5. **Paul Copplestone (Supabase) — Launch Week X overview post** — https://www.linkedin.com/posts/paulcopplestone_every-few-months-supabase-does-a-launch-activity-7135649105879465984-8Ma_ — ≈ Dec 2023 (estimated) — tier 1
   - Numbers: 126 reactions, 5 comments, read 2026-11-09
   - Why it worked: weakest fit, included for contrast only — no security content to draw from.

### Checklist
- State the RBAC/validation claim as a plain bullet inside a normal feature list — don't give it a separate "trust" paragraph.
- Avoid adjectives ("secure," "robust," "enterprise-grade") next to the claim; state what is enforced and where (server-side) in neutral language.
- If a comment raises a skeptical or architecture-risk question, answer the mechanism directly and calmly rather than reassuring generically.
- A short demo of a blocked/denied action (permission check failing as expected) is more convincing on this topic than a success-path clip alone.

---

## linkedin:d5

Slot purpose: day-5 feature post — scaffolder → deployed site + week recap — native clip + link.
Constraints: no official length or link-card limit found (§5.17, [UNVERIFIED]); the day's clip is a native upload, silent, so the post text describes what it shows (Design Decision 11); link the day's canonical URL in the body.

### Examples (ranked)
1. **Paul Copplestone (Supabase) — Launch Week X overview/countdown post** — https://www.linkedin.com/posts/paulcopplestone_every-few-months-supabase-does-a-launch-activity-7135649105879465984-8Ma_ — ≈ Dec 2023 (estimated) — tier 1
   - Numbers: 126 reactions, 5 comments, read 2026-11-09
   - Opening line: "Every few months, Supabase does a \"Launch Week\" where we ship a major feature every day for a week."
   - Why it worked for a recap-style post: this is a "the week, as a format" post rather than a single-feature post — closest structural twin to a week-recap, even though it's framed as a countdown rather than a retrospective · the 3-bullet "sequence of events" list is a reusable shape for "here's everything that shipped" summaries.

2. **James Mikrut (Payload) — "Payload Cloud is live"** — https://www.linkedin.com/posts/james-mikrut-3202985a_payload-cloud-is-live-activity-7048667132678590467-YofY — ≈ Apr 2023 (estimated) — tier 1
   - Numbers: 79 reactions, 14 comments, read 2026-11-09
   - Why it worked: pairs a personal post with a company-page echo of the same announcement — a pattern worth reusing on a week-recap day since both a personal retrospective angle and a project/repo-page summary can run the same week.

3. **Zeno Rocha (Resend) — Inboxes/Forge launch** — https://www.linkedin.com/posts/zenorocha_today-were-launching-resend-inboxes-an-activity-7518715636206764033-YWts — ≈ late Oct 2026 — tier 2
   - Numbers: 272 reactions, 32 comments, read 2026-11-09
   - Why it worked: bundling two distinct shipped things into one post without diluting either (clear paragraph break, "we're also launching Forge") — directly applicable to a recap post that has to mention the scaffolder, the deployed demo site, and the week as a whole without feeling like three posts stitched together.

4. **Paul Copplestone (Supabase) — Day 3 / Supabase AI post** — https://www.linkedin.com/posts/paulcopplestone_its-supabase-launch-week-yesterday-we-launched-activity-7095347969490657280-GS-Y — ≈ Aug 2023 (estimated) — tier 1
   - Numbers: 124 reactions, 7 comments, read 2026-11-09
   - Why it worked: weaker fit (single-feature, not a recap), included because the native-clip mechanics (silent-readable walkthrough) still apply if day 5's clip is "scaffold → live URL in under a minute."

5. **Paul Copplestone (Supabase) — Supabase Vector post** — https://www.linkedin.com/posts/paulcopplestone_supabase-vector-the-postgres-vector-database-activity-7069800988135624704-5rHN — ≈ Jun 2023 (estimated) — tier 1
   - Numbers: 263 reactions, 14 comments, read 2026-11-09
   - Why it worked: weakest fit, included for contrast — a single-artifact post without any week-level framing, useful as a reminder not to under-frame a recap post as just another feature drop.

### Checklist
- Frame day 5 as "the week" first, the specific scaffolder feature second — mirror the day-1 overview post's "format, then specifics" order.
- If posting both a personal recap and a project/repo update, keep them as two distinct posts/pages rather than merging, per the Payload personal+company-page pattern.
- A clip of "scaffold command → live deployed URL" end-to-end is the single strongest native-clip option of the whole week — keep it under the length of the other four days' clips if possible, since it's naturally the fastest workflow to show.
- Close the week with a plain list of what shipped (3–6 bullets), not adjectives about the week.

---

## discord:d1

Slot purpose: a short reply under the developer's own existing #show-and-tell-style post, announcing the 0.1.0 release — not a new post.
Constraints: a comment under the developer's existing #show-and-tell post, not a new post; the channel has no pinned rules (developer, 2026-11-08; §5.10 couldn't be read logged out).

Convex's own Discord ("Convex Community," 16,680 members, joinable at convex.dev/community / discord.gg/convex, description: "Where Convex builders ask questions, share what they're building") is not crawlable, so the examples below are structural analogues from platforms that publish the same pattern — a maintainer or builder replying inside their **own existing** showcase/announcement thread with a short release update, rather than opening a new thread. Each is flagged by tier and by how closely it matches "reply in an existing thread" vs. "new post in a showcase category."

### Examples (ranked)
1. **JediKev (osTicket maintainer) — reply inside the "osTicket 2.0 Announcement" thread** — https://github.com/osTicket/roadmap/discussions/72 — original post Mar 11, 2026, maintainer reply Aug 4, 2026 — tier 3 (GitHub Discussions "Announcements" category, not Discord, not literally "Show and tell" — but the single closest match found to "a comment under an existing post," since the maintainer replies in the same thread months after the original rather than opening a new one)
   - Numbers: original post 13 upvotes, 🎉11 ❤️4 🚀2 reactions, 3 comments · 3 replies total on the thread, read 2026-11-09 directly from the GitHub Discussions page
   - Opening line (of the original post, for context): "We're getting very close to the osTicket 2.0 release!"
   - Reply text in full (short enough to quote whole, since it is the exact genre this slot needs): "@RoadBlack We sent out an update not too long ago to our newsletter subscribers. TLDR; we pushed beta release from Q2 to Q3. Stay tuned! If you want to stay up to date with osTicket v2.0, the best resource is the new website. I would also encourage you to sign up for the newsletter… Cheers."
   - Why it worked: title shape — the reply has no title, it's a direct answer to a named commenter (@-mention) who'd asked "any updates?" · hook — leads with the status in one line (TLDR) before the links · proof — points to a canonical source (new site) instead of re-explaining everything inline · length — two short sentences plus two links · tone — grateful, low-hype ("Stay tuned," "Cheers") · comment handling — the maintainer replies directly to the person waiting, by name, instead of posting a broadcast update with no addressee.

2. **KyoumaSteiner — "A small RLS read-test case study: what makes testing a real app difficult?"** (Supabase GitHub Discussions, Show and tell) — https://github.com/orgs/supabase/discussions/51878 — posted Oct 18, 2026, last reply Nov 7, 2026 — tier 1 (same platform/ecosystem: Postgres-based BaaS community)
   - Numbers: 2 upvotes on the original post, 4 comments (1 reaction each), 5 participants total, read 2026-11-09 directly from the GitHub Discussions page
   - Opening line: "We've been working on AI Launch Check, an AI-assisted experiment around pre-launch permission tests."
   - Why it worked: shows a concrete before/after results table instead of adjectives · explicitly states the limits of what was tested ("Writes, views, RPCs and Storage weren't covered") instead of overclaiming · ends with a specific, answerable question to the room ("where did your last attempt to test cross-user access get stuck?") — this single line is what produced 4 substantive technical replies over three weeks, i.e. the thread stayed alive well past the original post, the exact shape a 0.1.0 reply should aim to join rather than restart · tone — hedged, non-promotional ("There's no established advantage or paying customer behind our experiment").

3. **grzesiekgs — "bridge between jotai and convex - convex-jotai"** (posted in Jotai's own GitHub Discussions, Show and tell) — https://github.com/pmndrs/jotai/discussions/3209 — posted Jan 7, 2026 — tier 1 (a Convex-ecosystem component, posted into an adjacent project's showcase category — the closest found example of an individual Convex-adjacent builder using a show-and-tell channel)
   - Numbers: 2 upvotes, ❤️1 reaction, 0 comments, read 2026-11-09 directly from the GitHub Discussions page — flagged as low engagement, included for genre fit (Convex-specific) rather than performance
   - Opening line: "Hey there! 👋 I just built a bridge for Jotai + Convex. It essentially does for Convex what jotai-tanstack-query does for TanStack — enabling you to reactively consume queries inside your atoms."
   - Why it worked (sparingly, given the low engagement): one-sentence "what it does for you" framing stated as an analogy to a tool the audience already knows · GitHub link immediately after, no further pitch · friendly, low-key tone (a single wave emoji, nothing else) — a reasonable minimum-viable model for a terse reply, even though it didn't generate replies itself.

4. **jshcodes (CrowdStrike/falconpy maintainer) — serial "Version X.Y.Z released!" posts** (Show and Tell category) — e.g. https://github.com/CrowdStrike/falconpy/discussions/1516 ("Version 1.6.6 released!", Sep 28, 2026) — tier 3, **explicitly weak-engagement example, included only for format reference**
   - Numbers: 0 comments observed on discussion #1516 as of the 2026-11-09 read; the category page shows the same author posting this exact short-form release note repeatedly (1.6.2 → 1.6.6) as **new** pinned posts rather than replies within one thread, each with similarly minimal engagement — [UNVERIFIED beyond the 0-comment count actually shown on the page; flagged because this pattern does NOT match "reply in an existing thread," it matches "repost a new short note every release"]
   - Why included despite weak performance: the note format itself is reusable even though the engagement isn't — one bolded title line, then a 2–3 line "what changed" summary, then a short checklist (Enhancement / Bug Fixes / tests updated) — a legitimate terse release-note shape for the actual 0.1.0 reply text, decoupled from this project's lack of comments.

### Checklist
- Reply inside the existing thread/post about the project — do not open a new post for a version update if one already exists (osTicket pattern; falconpy shows the weaker alternative of always starting fresh).
- If anyone in the thread already asked "when/what's next," answer them by name before or instead of a general announcement (osTicket pattern).
- Keep the reply to 2–4 sentences: what shipped, one link, done — no re-pitch of the whole project.
- Lead with one concrete fact (a status line, a number, a result), not adjectives (Supabase RLS case-study pattern).
- Check the server's self-promotion rule first — Discord showcase/show-and-tell channels (Supabase's #showcase, Convex's community channel) tolerate build updates but not cross-posted marketing copy; per the Discord self-promotion guide below, be useful first and disclose affiliation, don't cross-post the same message into other channels, and stay around to answer replies.

---

## devto:announcement

Slot purpose: dev.to cross-post of the 0.1.0 announcement, canonical URL back to vexcms.dev.
Constraints: front matter `title`, `published`, `tags` (≤ 4, comma-separated), `canonical_url: https://vexcms.dev/posts/vexcms-0-1-0`, `ai_disclosure_level` set truthfully (§5.13).

### Examples (ranked)
1. **Supabase — "Introducing Vector Buckets"** — https://dev.to/supabase/introducing-vector-buckets-3134 — published 2025-12-18 — tier 1
   - Numbers: 16 public reactions, 1 comment, read 2026-11-09 from `https://dev.to/api/articles/supabase/introducing-vector-buckets-3134`
   - Opening line: "We're introducing Vector Buckets, a new storage option that gives you the durability and cost efficiency of Amazon S3 with built-in similarity search."
   - Why it worked: title shape is a plain "Introducing X" (no hype) · hook is the problem the feature solves, stated in sentence one · proof is a comparison table ("Use pgvector when… / Use Vector Buckets when…") not adjectives · demo/code sits mid-post after the concept is explained, five numbered "Get started" steps close it · length ~1,350 words, all technical · tone is flat and factual throughout · `canonical_url` front-matter field points to `https://supabase.com/blog/vector-buckets` — exactly the cross-post + canonical pattern VexCMS needs · cover image is the product's own diagram, not stock art · comments: n/a (1 comment, not from the maintainer).

2. **Roelof Jan Elsinga — "Aloia CMS: Version 1.0.0 has released!"** — https://dev.to/roelofjanelsinga/aloia-cms-version-1-0-0-has-released-bo8 — published 2020-02-19 — tier 1
   - Numbers: 12 public reactions, 0 comments, read 2026-11-09 from the dev.to article API
   - Opening line: "This is a bit of a different post than I normally write, as these are release notes for the first stable version of my CMS: Aloia CMS."
   - Why it worked: title states the fact plainly ("Version 1.0.0 has released!") with no superlatives · hook is personal — a solo maintainer naming his own project by name in sentence one · proof is a full breaking-changes list plus an upgrade command (`php artisan aloiacms:upgrade-0-to-1`), not marketing claims · demo/link placement: docs link in paragraph one, code blocks for every breaking change · length ~650 words, short and scannable · tone is plain engineering changelog, closest format match to a solo maintainer's own 0.1.0 post · `canonical_url` points to `https://aloiacms.com/articles/version-1-0-released`, the maintainer's own site — the exact dev.to cross-post pattern VexCMS needs · how the maker handled comments: n/a, zero comments on this post.

3. **Strapi — "Introducing Yearly Plans and New Limits for Strapi Cloud"** — https://dev.to/strapi/introducing-yearly-plans-and-new-limits-for-strapi-cloud-165l — published 2026-02-06 — tier 1
   - Numbers: 0 public reactions, 0 comments, read 2026-11-09 from the dev.to API
   - Opening line (from the dev.to listing description, full body not fetched): "Back in March, we introduced a new pricing model, making Strapi Cloud more accessible."
   - Why it worked: n/a on engagement (zero reactions) — included specifically because it shows the downside of routine cross-posts · title shape is literal, no hook beyond the feature name · `canonical_url` points to `https://strapi.io/blog/introducing-yearly-plans-and-new-limits-for-strapi-cloud` (Strapi's own blog), confirming the org posts every dev.to article as a canonical-linked cross-post, release or not · tags are 2–3 product-specific terms, not generic · cover image matches the strapi.io blog hero.

4. **Directus — dev.to cross-post pattern** (e.g. "Migrating from Notion to Directus") — https://dev.to/directus/migrating-from-notion-to-directus-4epm — published 2023-11-27 — tier 1
   - Numbers: 1 public reaction, 0 comments, read 2026-11-09 from the dev.to API
   - Opening line (from listing description, full body not fetched): "Discover how to migrate your data from Notion to Directus as a powerful and customizable headless CMS."
   - Why it worked: included as a pattern example, not an announcement — Directus's dev.to org account cross-posts every article (tutorials and releases alike) with `canonical_url` pointing to `https://docs.directus.io/blog/...` · cover image is hosted on their own marketing CMS instance (`marketing.directus.app`), i.e. the cover art is pulled from the canonical source, not re-uploaded to dev.to · title case matches the canonical post's title exactly, word for word · tags stay under dev.to's 4-tag limit.

### Checklist
- Set `canonical_url` in front matter to the exact vexcms.dev announcement URL before publishing, not after.
- Open with one plain sentence naming the thing and what it is — no scene-setting paragraph first.
- Reuse the cover image and title from the canonical post verbatim; don't re-author either for dev.to.
- Keep code/demo material placed after the concept is explained in prose, not before.
- Expect low-to-modest reaction counts (0–20) on a routine or solo-maintainer cross-post; that is normal, not a signal to change the post.
- Stay inside dev.to's 4-tag limit and prefer specific product/feature tags over generic ones.

## hashnode:announcement

Slot purpose: cross-post of the 0.1.0 announcement, canonical-linked via Hashnode's "Add Original Article."
Constraints: canonical URL set with "Add Original Article" (§5.14); optional "hide from Hashnode" feed setting; no limits found.

### Examples (ranked)
1. **Lakhan Samani — "Introducing Authorizer 1.0"** — https://blog.authorizer.dev/introducing-authorizer-10 (syndicated at https://hashnode.com/posts/introducing-authorizer-10/62fa76cdfffdab933bded2b4) — published 2022-08-15 — tier 1
   - Numbers: 0 comments ("No responses yet" on the Hashnode discussion page), read 2026-11-09; reaction/view count not exposed by a logged-out fetch, so marked `[UNVERIFIED]` for reactions
   - Opening line: "We're excited to announce the stable version of https://authorizer.dev with the most significant updates 🥳."
   - Why it worked: title shape is a plain "Introducing X N.N" · hook is the one-line value prop in sentence one, auth-as-a-service positioning close to VexCMS's own auth/RBAC story · proof is a numbered "get started in 3 steps" block plus a feature-by-feature walkthrough with screenshots, not adjectives · demo/link placement: a YouTube walkthrough embedded about two-thirds down, after every feature is explained in text first · length ~900 words · tone is a solo/small-team maintainer's own voice, not corporate · hosted on the maintainer's own Hashnode-powered custom domain (`blog.authorizer.dev`) and syndicated into the main Hashnode feed — the closest real precedent found for "Hashnode as a secondary distribution surface pointing back to a canonical source," though the direction is reversed from VexCMS's "Add Original Article" flow · how the maker handled comments: n/a, no comments to respond to.

2. **Paolo Insogna (Platformatic) — "Watt v3.18 Unlocks Next.js 16's 'use cache' Directive with Redis/Valkey"** — https://blog.platformatic.dev/watt-v318-unlocks-nextjs-16s-revolutionary-use-cache-directive-with-redisvalkey (syndicated to Hashnode) — published 2025-11-18 — tier 2
   - Numbers: 0 comments on the Hashnode discussion thread, read 2026-11-09; reactions `[UNVERIFIED]`, not exposed by a logged-out fetch
   - Opening line: "Watt 3.18 enhances Next.js 16 with Redis/Valkey for improved component-level distributed caching and performance." (from the Hashnode feed card, full body not fetched)
   - Why it worked: title names the exact version and the exact upstream dependency it unlocks (Next.js 16's `use cache`), a pattern VexCMS could mirror for its own Next.js/Convex version-coupling · ~7 minute read, technical dev-tool release note · same custom-domain-plus-Hashnode-syndication mechanic as the Authorizer example · how the maker handled comments: n/a.

3. **Hashnode/Bug0 — "We just open sourced Passmark, the AI testing framework we built at Bug0"** — https://hashnode.com/blog/we-just-open-sourced-passmark-the-ai-regression-testing-framework — published 2026-04-03 — tier 3
   - Numbers: not exposed by a logged-out fetch, marked `[UNVERIFIED]`; read 2026-11-09
   - Opening line (tldr line, used in place of the narrative opener): "Passmark is an open-source AI regression testing framework built on Playwright."
   - Why it worked: published natively on `hashnode.com/blog`, by the Hashnode co-founders themselves, making it the clearest real precedent for what a hashnode.com-hosted OSS release post looks like structurally · the post explicitly names a second canonical location one paragraph in ("Here is the official announcement on the Bug0 blog") linking to `bug0.com/blog/...` — i.e. Hashnode is openly used as a secondary, cross-linked surface rather than the source of truth, the same relationship VexCMS's Hashnode post will have to `vexcms.dev` · structure: tldr line, "why we built it," a code sample, a "why we open sourced it" section, then an FAQ block at the very end · length is long-form (~1,400 words with code), closer to a feature post than a short announcement · tone is personal ("We are Fazle and Sandeep...").

### Checklist
- Use Hashnode's "Add Original Article" field to set the canonical URL to the vexcms.dev announcement before publishing, matching the dev.to front matter exactly.
- Hashnode has far less public precedent for solo-maintainer OSS release cross-posts than dev.to does — expect this post to carry less inherent distribution value than the dev.to one and treat it as SEO/completeness, not a traffic driver.
- If reusing the dev.to body, keep the tldr/opening sentence first — none of the examples bury the "what this is" line.
- A closing FAQ block is optional but appears in the one native hashnode.com example found; consider it only if the dev.to version already has one.

## devhunt:listing

Slot purpose: the DevHunt tool-page description (name, tagline, description, screenshots) for `/tool/vexcms`.
Constraints: name, website, description, logo and screenshots (§2.9); no field-length limits found (§2.9, §2.10, [UNVERIFIED]); categories include Open Source, DB, Code (§2.10).

### Examples (ranked)
1. **Bloggrify** — https://devhunt.org/tool/bloggr — launched Mar 26, 2024 — tier 1 (same platform, OSS CMS/static-site tool)
   - Numbers: 47 upvotes, 25,062 impressions, #3 product of the week, 1 comment — read 2026-11-09 from devhunt.org/tool/bloggr
   - Opening line: "From your Markdown files to a deployed blog in a few minutes"
   - Why it worked: title shape = product name only, no tagline appended · hook = one concrete outcome ("markdown files → deployed blog") not a category label · proof = MIT license badge, linked GitHub repo (168★/21 forks) shown inline, "works with" integration row (Vercel, Netlify, GitHub Pages…) · demo/link placement = 3 screenshots directly under the fold, "Visit website" button above the fold · length = tagline ≤10 words, body description 4 short clauses ("secure… fast… simple… cheap…") · tone = plain, no superlatives · comments: n/a — DevHunt has no maker-reply norm like HN/PH, the single comment ("Awesome project. Supported") went unanswered by the maker.

2. **React Bricks** — https://devhunt.org/tool/react-bricks — launched Jan 3, 2023 — tier 1
   - Numbers: 29 upvotes, 11,923 impressions, #20 of its week — read 2026-11-09 from devhunt.org/tool/react-bricks
   - Opening line: "Visual editing for content creators, React code for developers, no way to break design system, enterprise ready."
   - Why it worked: title shape = three comma-joined value clauses, one per audience (creators / devs / enterprise) · hook = names the exact tension it resolves ("no way to break design system") · proof = embedded YouTube demo thumbnail first in the gallery, before static screenshots · demo/link placement = video first, screenshots second · length = tagline is one long sentence (~18 words) but each clause is self-contained · tone = confident but literal, no "revolutionary" · comments: n/a, zero comments on the listing — maker did not need to engage.

3. **BCMS** — https://devhunt.org/tool/bcms — launched Jan 3, 2023 — tier 1
   - Numbers: 21 upvotes, 33,467 impressions, #33 of its week, 2 comments — read 2026-11-09 from devhunt.org/tool/bcms
   - Opening line: "Open-source Contentful alternative"
   - Why it worked: title shape = positions against a known competitor in 3 words, category instantly legible · hook = "Works nicely with Gatsby, Next.js & Nuxt. You can even self-host it." names frameworks by name, not "all major frameworks" · proof = GitHub repo badge (464★/30 forks) and MIT license field both exposed as structured facts, not prose · length = description is 2 short sentences · tone = plain, mild and almost offhand ("You can even self-host it") · comments: maker did not reply to either comment ("很棒" / "I love these gradients") — no engagement expected on DevHunt.

4. **Contentrain** — https://devhunt.org/tool/contentrain — launched May 14, 2024 — tier 1
   - Numbers: 6 upvotes, 7,550 impressions, #5 of its week — read 2026-11-09 from devhunt.org/tool/contentrain
   - Opening line: "Headless CMS that combines Git and Serverless platforms for scalable content workflows."
   - Why it worked: title shape = category + two-mechanism differentiator ("Git and Serverless") stated plainly · hook = names the two unusual technical choices instead of a generic value prop · proof = "works with" row lists exact tools (Claude Code, Cursor, Windsurf, Nuxt, Next.js, Astro, GitHub, GitLab, Vercel) rather than a vague "integrates with your stack" · length = tagline is one sentence, ~12 words · tone = plain and slightly dry ("It helps both developers and content creators…") · comments: n/a, zero comments on the listing.

### Checklist
- Lead the tagline with a concrete outcome or named differentiator, not a category label alone.
- Keep the DevHunt tagline to one sentence (≤20 words); let the longer description carry the "for whom" clause.
- Expose license, repo stats (stars/forks) and named framework integrations as structured facts (DevHunt's own fields), not buried in prose.
- Put the strongest visual first in the gallery — a short demo clip outranks static screenshots when one exists.
- Do not plan to reply to DevHunt comments the way HN/PH expect — none of the four examples show maker replies.
- Avoid hype words ("revolutionary", "best") — every example above stays in plain, almost flat, descriptive language.

---

## cooperpress:email

Slot purpose: the pitch email to editor@cooperpress.com covering JavaScript Weekly, Node Weekly and React Status.
Constraints: email to editor@cooperpress.com, one address for JavaScript Weekly, Node Weekly and React Status; no form, a short direct pitch (§5.1).

No public pitch email for a comparable tool could be found — Cooperpress's only published submission guidance is the editorial contact address and "We're always happy to talk!" (cooperpress.com, `sources.md` §5.1). The examples below are therefore **published newsletter blurbs of comparable tools**, standing in for the pitch: they show what Cooperpress actually runs when a tool like this gets covered, which is the best available proxy for what the email should earn.

### Examples (ranked)
1. **"Payload, a Node-Based Headless CMS, Now Fully Open Source"** — https://react.statuscode.com/issues/291 — React Status #291, June 1, 2022 — tier 1 (same-publisher newsletter, same-category OSS CMS)
   - Numbers: newsletter issue, no public open/click metric for a single blurb; Cooperpress's own media kit states JavaScript Weekly reaches "over 170,000" subscribers (cooperpress.com/files/cooperpress-media-kit-q4-2026.pdf, via search snippet, not independently verified — `[UNVERIFIED]` at the per-issue level) — read 2026-11-09
   - Opening line: "Payload…has just moved to the MIT license which opens up a lot more use cases."
   - Why it worked: title shape = "<Product>, a <category>, Now <event>" — the news hook is the event, not the product · hook = a license change (an actual news event), not a generic "we launched" · proof = direct GitHub repo link in the blurb · demo/link placement = one link to the company's own blog post, one to the repo · length = one paragraph, ~40 words · tone = factual, states what changed and why it matters ("opens up a lot more use cases") · comments: n/a — newsletter has no comment thread; byline credits "James Mikrut (Payload CMS Blog)", i.e. the canonical source was the maker's own announcement, exactly what Cooperpress's "please submit the original source" instinct rewards.

2. **"webframe: Run a Web Page Like a Command-Line Program"** — https://javascriptweekly.com/issues/809 — JavaScript Weekly #809, November 3, 2026 — tier 2 (same publisher, general dev tool not CMS)
   - Numbers: same per-issue caveat as above — `[UNVERIFIED]` at blurb level; issue dated and read 2026-11-09
   - Opening line: "Point it at a URL or HTML file and it runs the page in a hidden system web view, piping console.log() to stdout and exceptions to stderr."
   - Why it worked: title shape = "<name>: <plain-English one-liner>" · hook = the single most unusual mechanic, stated as a fact, not a pitch · proof = "No bundled browser or Playwright needed" — one differentiator against the obvious alternative · length = one sentence · tone = flat and technical · comments: n/a, byline is the maker's real name (Jeff Lindsay), suggesting this was either self-submitted or picked up from a release post.

3. **"djs: A New 'Suspend Anywhere' JavaScript Engine"** — https://javascriptweekly.com/issues/809 — JavaScript Weekly #809, November 3, 2026 — tier 2
   - Numbers: same caveat — `[UNVERIFIED]` at blurb level, read 2026-11-09
   - Opening line: "Armin…built an engine to run scripts in WebAssembly that can snapshot the VM's state and resume elsewhere, even mid-`await`."
   - Why it worked: title shape = project name + short descriptive clause in quotes for the novel concept · hook = names the author's other well-known project (Flask) for credibility in one clause · length = one sentence · tone = matter-of-fact · comments: n/a.

### Checklist
- Angle the email around one concrete, dated event (new MIT license, v1.0, a release) — not a generic "we built a CMS" pitch; Cooperpress's own covered examples are all event-driven.
- Lead with what changed and why it's useful in one sentence; the editors visibly compress every pitch to a single paragraph or less.
- Link the canonical source (repo or the project's own post) — Cooperpress's React Status #291 blurb bylines the company's own blog, not a third party.
- Send one email to editor@cooperpress.com covering all three relevant titles (JS Weekly, Node Weekly, React Status) rather than three separate pitches — `sources.md` §5.1 confirms one shared address.
- Do not expect or request a reply thread — none of these channels carry comments; treat the email as a single, polite, factual pitch and move on.
- Treat per-issue reach/click numbers as unverifiable; only the outlet-level subscriber claim ("over 170,000") is published, and only in Cooperpress's own media kit, not per blurb.

---

## twir:note

Slot purpose: a short, direct note to Sébastien Lorber (This Week In React) during launch week — cold outreach, not a submission queue.
Constraints: no submission route; a direct note to Sébastien Lorber through the contacts on his issue pages (§5.2, [UNVERIFIED]).

### Examples (ranked)
1. **TWIR Editorial Line (official selection criteria)** — https://thisweekinreact.com/editorial-line — fetched 2026-11-09 — tier 1 (primary source, direct from the author)
   - Numbers: n/a — policy page, not a ranked post
   - Opening line: "We want to be the pulse of the React ecosystem, not a discovery tool for every React npm package."
   - Why it worked (as *guidance*, read literally): explicitly filters out "Product news: launches and features tied to a single vendor, a single platform or a paid plan" and "Brand-new side projects that may not be maintained for long" — both apply directly to a 0.1.0 VexCMS launch note; also filters "Most UI libraries and boilerplates… we don't cover their launch, but we might cover their v10."

2. **Convex sponsor placement, "Convex: The Database Designed for AI Coding"** — https://thisweekinreact.com/newsletter/231 — TWIR #231, April 23, 2025 — tier 1 (same newsletter, Convex-ecosystem)
   - Numbers: n/a — sponsor slot, not organically ranked; marked "💸 Sponsor" in the issue itself — read 2026-11-09
   - Opening line: "In the age of code generation, you need a backend that you can confidently generate with AI platforms."
   - Why it worked: this is the only confirmed route a Convex-adjacent tool took into TWIR — **paid sponsorship**, not an organic mention; title names the product + one outcome; body is three short bullets of concrete capabilities ("schedule functions," "set up file storage") plus a single CTA link ("Try a Quickstart today") · tone = plain, no hype · comments: n/a.

3. **Organic one-line package mention, "c15t"** — https://thisweekinreact.com/newsletter/231 — TWIR #231, April 23, 2025 — tier 2 (same newsletter, different category of tool)
   - Numbers: n/a
   - Opening line: "c15t: A new consent management framework coming with drop-in React components."
   - Why it worked: this is the shape an organic, unpaid package mention actually takes in TWIR — one `📦` bullet, name + colon + one clause, no elaboration, linked straight to the GitHub repo. This is the realistic ceiling for what a cold note could earn (a single bullet, not a feature).

### Checklist
- Treat this as cold outreach with low odds of organic coverage — TWIR's own editorial line filters out single-vendor launches and brand-new side projects by name.
- The only confirmed path for a Convex-ecosystem tool into TWIR to date is a paid sponsor slot, not an organic mention — do not assume a free note will get a feature.
- If writing anyway, match the organic one-liner shape actually used for unpaid package mentions: name, one clause, link — not a pitch paragraph.
- Address it to Sébastien Lorber directly via his listed contact channels (GitHub, X, Bluesky, LinkedIn — `sources.md` §5.2); there is no submission form.
- Do not expect a reply or follow-up; this is a single message, not a queue.

---

## jamstack:description

Slot purpose: the `description` front-matter field for `src/site/headless-cms/vexcms.md`.
Constraints: `description` front matter of `src/site/headless-cms/vexcms.md`; sibling keys `title`, `homepage`, `twitter`, `opensource: "Yes"`, `typeofcms`, `supportedgenerators`, optional `images` (§5.4).

### Examples (ranked)
1. **Strapi** — 73,450★ — `src/site/headless-cms/strapi.md`
   - Front matter: `title, repo, homepage, twitter, opensource: "Yes", typeofcms: "API Driven", supportedgenerators: [All], description, images` (4 images)
   - Opening line (full `description` value, 207 chars / 29 words): "Strapi is the leading open-source headless CMS. It's 100% Javascript, fully customizable, support TypeScript and developer-first. It saves API development time through a beautiful admin panel anyone can use."
   - Why it worked: leads with a category-leader claim backed by the repo's own star count elsewhere on the page · names the exact languages/guarantees (100% JS, TypeScript support) instead of adjectives · one sentence names the audience benefit (saves API development time) · ends on the admin panel, the thing a visitor will actually look at.

2. **Payload CMS** — 45,745★ — `src/site/headless-cms/payload-cms.md`
   - Front matter: same required keys, no `images` field set.
   - Opening line (151 chars / 24 words): "Payload is a free and open-source headless CMS aimed sharply at providing the best, developer-first experience possible to build out APIs and admin UI."
   - Why it worked: "free and open-source" stated plainly in sentence one · "aimed sharply at" is the one piece of personality in an otherwise flat, factual sentence · names the two concrete deliverables (APIs and admin UI) instead of "a complete solution."

3. **Directus** — 38,673★ — `src/site/headless-cms/directus.md`
   - Front matter: `opensource: "No"` (Directus is BSL-licensed, not Apache/MIT — note this is the opposite of VexCMS's Apache-2.0 "Yes"), 1 image.
   - Opening line (46 chars / 9 words): "The CMS (and more) you've been looking for 😎🐰."
   - Why it worked: shortest description in the set by far — a single playful sentence with an emoji sign-off, relying entirely on the long-form body below it to do the selling; shows the front-matter `description` can be a one-liner teaser rather than a full value statement.

4. **Decap CMS** — 19,469★ — `src/site/headless-cms/decap-cms.md`
   - Front matter: adds `startertemplaterepo` (not present in the other four), 3 images.
   - Opening line (184 chars / 35 words): "A different kind of CMS. It's a single page app written in React. It's an npm package. It's a script running on a static page that lives in your repo. Built for static site generators."
   - Why it worked: four short declarative sentences, each naming a different concrete fact about what the thing *is* (SPA, npm package, embeddable script) rather than what it does for you — ends with the one line that actually matters for jamstack.org's audience ("Built for static site generators").

5. **TinaCMS** — 13,867★ — `src/site/headless-cms/tinacms.md`
   - Front matter: `typeofcms: "Git + API"` (distinct value from "API Driven" used by the other four — the field is a controlled-ish vocabulary, not fixed enum).
   - Opening line (138 chars / 21 words): "TinaCMS is a free and open-source headless CMS focused on providing the best developer experience for building web sites and applications."
   - Why it worked: near-identical phrasing pattern to Payload's ("free and open-source headless CMS focused on...") — suggests this is close to the house style contributors converge on; names the one differentiator class (developer experience) without listing features.

### Checklist
- Required front-matter keys, confirmed across all five entries: `title`, `repo`, `homepage`, `twitter`, `opensource` (string `"Yes"`/`"No"`), `typeofcms`, `supportedgenerators` (list), `description`; `images` and `startertemplaterepo` are optional.
- `typeofcms` is free text, not a fixed enum — observed values: "API Driven" (Strapi, Payload, Keystone, Directus), "Git + API" (TinaCMS), "Git-based" (Decap CMS) — pick the phrase that matches VexCMS's actual model (Convex-backed, real-time) rather than reusing one verbatim.
- Keep the front-matter `description` to one paragraph, 1–4 sentences (observed range 46–207 characters / 9–29 words); the long-form body below it carries screenshots and feature depth, not the front matter.
- `opensource: "Yes"` entries (Strapi, Payload, TinaCMS, Decap CMS) consistently open their description with "free and open-source" as the first clause — `opensource: "No"` entries (Directus) do not.
- No numeric star/traffic minimum gates inclusion — confirmed by LeadCMS (merged PR #1057, jamstack/jamstack.org, Feb 2026) entering with a brand-new, low-star repo using the identical front-matter shape, so stars affect ranking-by-reader-impression only, not eligibility.

---

## awesome-nextjs:line

Slot purpose: the single `[Name](link) - Description.` line for the PR against `unicodeveloper/awesome-nextjs`.
Constraints: `[Title Case Name](link) - Description.`, capital start, full stop end, one PR per suggestion (§5.7).

**Important finding, not assumed in `sources.md`:** the live README has **no dedicated CMS or "Headless CMS" section**. Searching the full README for Payload/Directus/Strapi/Sanity/Contentful/Convex turns up only tutorial-article mentions and CMS-*powered starter templates* inside **Boilerplates** (e.g. "NextJS Headless CMS Powered Blog Starter," "Next.js, Strapi Portfolio Starter") — never a CMS product listed as itself. A full, non-template open-source product like VexCMS has two plausible homes: **Boilerplates** (if framed as the `create-vexcms` scaffolder) or **Apps** (if framed as the CMS product itself, following the "open source alternative to X" pattern below). This is a developer decision, not one `sources.md` §5.7 resolves.

### Examples (ranked)
1. **"NextJS Headless CMS Powered Blog Starter"** — https://github.com/ButterCMS/react-cms-blog-with-next-js — Boilerplates section — tier 1 (same platform, CMS-powered)
   - Numbers: n/a — static list entry, no votes/reactions tracked on the list itself
   - Opening line: `[NextJS Headless CMS Powered Blog Starter](https://github.com/ButterCMS/react-cms-blog-with-next-js)` (no description clause at all)
   - Why it worked: title shape = the CMS name is embedded in the link text itself, not a separate description · proof = none beyond the repo link · length = title only, zero description — shows the format tolerates a bare link when the title is self-explanatory · tone = n/a · comments: n/a, PR review not a comment thread.

2. **"Next.js, Strapi Portfolio Starter"** — https://github.com/PictureElement/nextjs-strapi-portfolio-starter — Boilerplates — tier 1
   - Numbers: n/a
   - Opening line: "⚡️ A modern portfolio starter with Next.js, Strapi, and Tailwind CSS, featuring automated XML sitemap, JSON-LD schemas, OpenGraph metadata, and a contact form with spam protection."
   - Why it worked: title shape = "`<Framework>, <CMS/tool> <Category>`" pattern · hook = leads with the stack (Next.js, Strapi, Tailwind) by name · proof = lists concrete, checkable features (XML sitemap, JSON-LD, OpenGraph) instead of adjectives · length = one sentence, ~25 words · tone = plain, feature-enumerating.

3. **"GenPM Kits"** — https://genpm.net — Boilerplates — tier 2 (CMS mentioned as one of several kit types) — most recently merged entry, PR #652 merged 2026-10-13
   - Numbers: n/a — merged 2026-10-13 per `gh pr list --repo unicodeveloper/awesome-nextjs --state merged`, read 2026-11-09
   - Opening line: "Next.js kits (store, blog, CMS, landing, dropshipping) installed as source code you own, with Stripe, Drizzle and auth wired in and rules for your AI agent."
   - Why it worked: title shape = bare product name, no tagline · hook = "installed as source code you own" is the one differentiator stated plainly · proof = names exact dependencies (Stripe, Drizzle) instead of "integrations included" · length = one sentence, ~27 words.

4. **"CourseLit"** — https://github.com/codelit/courselit — Apps section — tier 2 (open-source product, not CMS, same "alternative to X" pattern)
   - Numbers: n/a
   - Opening line: "An open source alternative to Thinkific, Teachable etc."
   - Why it worked: title shape = bare name, link to GitHub repo (not marketing site) · hook = names two recognizable commercial competitors instead of describing features · length = 8 words, the shortest full-product entry in the README · tone = flat, no hype — this is the closest precedent for listing VexCMS as a product rather than a starter.

5. **"Looot Network"** — https://github.com/loootai/looot-network — Apps section — tier 2 — most recently merged product entry, PR #651 merged 2026-10-12
   - Numbers: n/a — merged 2026-10-12, read 2026-11-09 via `gh pr list`
   - Opening line: "Open source alternative to Happenstance: search your own LinkedIn, Google Contacts or CSV network in plain language."
   - Why it worked: title shape = "Open source alternative to X: <what it does>" · proof = names exact stack and license inline ("Built with Next.js 16 and Supabase, MIT") and discloses the paid add-on honestly ("optional paid enrichment needs a looot API key") · length = two sentences · tone = transparent about what's free vs. paid, not oversold.

### Checklist
- No "CMS" category exists in the live README — decide between **Boilerplates** (if the PR frames `create-vexcms` as a starter/scaffolder) and **Apps** (if it frames VexCMS as the standalone open-source product) before opening the PR; do not assume a new category will be accepted without checking current review norms first.
- Match the exact required format: `[Title Case Name](link) - Description.` — capital first letter, period at the end (`sources.md` §5.7, confirmed verbatim in CONTRIBUTING.md).
- One individual PR for this single suggestion — do not bundle with any other change (`sources.md` §5.7).
- A description is optional (ButterCMS's entry has none) but when present, observed entries run 8–27 words, one sentence, naming concrete stack/dependencies rather than adjectives.
- If listing VexCMS as a product (not a starter), the "open source alternative to X" pattern (CourseLit, Looot Network) is the closest precedent — name recognizable commercial competitors (e.g. Contentful, Sanity) rather than describing abstract features.
- Prefer a GitHub repo link over the marketing site, consistent with `enaqx/awesome-react`'s stated preference ("I would prefer GitHub links" — `sources.md` §5.8) even though awesome-nextjs itself doesn't state this rule explicitly; three of five examples above link straight to GitHub.

---

## post:real-time-admin-and-live-preview

Slot purpose: D2 feature post on the real-time admin panel + live preview, with a silent clip, a docs link, and a link back to the D1 announcement.
Constraints: slot format `title: …`, `excerpt: …`, blank line, markdown body (kit header). Step 9 transcribes the body into Plate JSON, and only `##` headings, paragraphs, **bold**, links and flat bullet/numbered lists map; tables, images, code fences and nested lists stop the transcription for a decision (spec step 9). Each post links its clip (`/launch/<slug>.mp4`), the fact sheet's docs page, the week's earlier posts, the `public-copy.md` Funding line and the roadmap page; no `planned`-issue links or 👍 asks (Design Decisions 12, 26; step 6).

### Examples (ranked)
1. **Supabase — "Realtime: Multiplayer Edition"** — https://supabase.com/blog/supabase-realtime-multiplayer-general-availability — 2022-08-18 — tier 1
   - Numbers: 356 points, 143 comments on Hacker News, read 2026-11-09 from `https://hn.algolia.com/api/v1/search?query=Supabase+Realtime+Multiplayer&tags=story` (story id 32510405)
   - Opening line: "During our last Launch Week, we teased our plans for 'multiplayer' features."
   - Why it worked: headline names the capability class ("Multiplayer") not a feature code name · first paragraph links back to the previous launch-week teaser, building continuity across days · a "TLDR" bullet list sits immediately after the opener, before any history or architecture · code samples (Broadcast example, Presence example) appear only after the concept is explained in prose, with a working snippet for each primitive · docs links are inline throughout, not batched at the end · closes with a "More Launch Week" block linking every other day of that week · length ~1,700 words (counted from the clean markdown body) · tone: technical founder-voice, explains *why* (a real CEO anecdote about a chat app and Postgres LISTEN/NOTIFY limits) before *what* · how the maker handled comments: the original poster (a Supabase engineer) answered technical questions directly in the HN thread rather than letting the company account speak for them.

2. **Payload CMS — "Launch Week Day 3 — Nested Editing UX"** — https://payloadcms.com/posts/blog/launch-week-day-3 — 2022 (Payload Launch Week) — tier 1
   - Numbers: `[UNVERIFIED]` — no distinct HN submission found for this specific URL as of 2026-11-09; the related "PayloadCMS Just Launched v3" HN story scored 5 points / 0 comments, a different post
   - Opening line (five-word deck under the hero, standing in for a lede): "Today, we're showcasing a new way to create and edit documents, nested in a modal, while other documents are being edited."
   - Why it worked: headline is "Launch Week Day N — [feature]", the exact pattern the VexCMS kit's day-post slugs already follow · the silent demo clip is embedded immediately after the opening paragraph, before any prose explaining how it works — clip first, explanation second · body then lists concrete "what we'll build on this next" bullets (Upload Field, Rich Text Uploads, Rich Text Relationships), turning a single-feature post into a roadmap teaser · closes with a one-line GitHub-star CTA and a one-line CLI install command, not a long sign-off · medium length, roughly ten short sections · tone is casual and first-person ("still can't believe most headless CMS admin panels aren't responsive in 2022").

3. **Dub — "Introducing real-time webhooks for Dub"** (Day 2 of Dub's first launch week) — https://dub.co/blog/introducing-webhooks — 2025-01-15 — tier 3
   - Numbers: 35 likes, 11 reposts, ~10K impressions on the day-1 X post promoting it, read 2026-11-09 from `https://launchweek.dev/lw/n/dub.md` (launchweek.dev's own tracked numbers, sourced from Dub's X analytics, not independently re-verified)
   - Why it worked: an interactive in-page webhook demo sits directly under the fold, before any prose · the post links forward to native integrations (Segment, Slack, Zapier) rather than describing the feature in isolation · per launchweek.dev's own analysis, this was the weaker of Dub's three launch-week days for social engagement — a useful caution that "real-time" features don't automatically outperform other day topics.

4. **Trigger.dev — "Preview branches"** (Launchweek 2, Day 2) — https://trigger.dev/launchweek/2/preview-branches — 2025-08-19 — tier 2
   - Numbers: `[UNVERIFIED]` — no distinct HN or social count found for this specific day-post URL as of 2026-11-09
   - Why it worked: a labelled architecture diagram ("Preview branches structure") sits right after the "why use preview branches" section, before the demo video · the demo video is introduced with one plain sentence ("In this video, we demonstrate how to use our preview branches with Vercel...") rather than a teaser line · a "How can I use preview branches?" numbered list closes the feature explanation before linking out to docs · every day-post in the launch week cross-links the other four days in a sidebar, so a reader lands on Day 2 and can jump to any other day in one click.

### Checklist
- Lead the headline with the capability name ("Real-time admin panel + live preview"), not a feature code name.
- Place the silent clip immediately after the opening paragraph, before the prose explanation — clip first, mechanism second.
- Explain the "why" (a concrete problem the feature solves) before the "how"; save code/config samples for after the concept is introduced.
- Close with links to the docs page and to the other launch-week day posts, not a generic sign-off.
- Don't expect every day's feature post to outperform the others on social — some features inherently generate less reaction than others, per Dub's own data.

## post:one-config-schema-and-types

Slot purpose: D3 feature post on one `vex.config.ts` → Convex schema + generated types, with a silent clip, a docs link, and links to earlier posts.
Constraints: slot format `title: …`, `excerpt: …`, blank line, markdown body (kit header). Step 9 transcribes the body into Plate JSON, and only `##` headings, paragraphs, **bold**, links and flat bullet/numbered lists map; tables, images, code fences and nested lists stop the transcription for a decision (spec step 9). Each post links its clip (`/launch/<slug>.mp4`), the fact sheet's docs page, the week's earlier posts, the `public-copy.md` Funding line and the roadmap page; no `planned`-issue links or 👍 asks (Design Decisions 12, 26; step 6).

### Examples (ranked)
1. **Supabase — "Supabase CLI v2: Config as Code"** — https://supabase.com/blog/cli-v2-config-as-code — 2024-12-04 (Launch Week 13, Day 1) — tier 1
   - Numbers: 2 points, 0 comments on Hacker News, read 2026-11-09 from `https://hn.algolia.com/api/v1/search?query=Supabase+CLI+v2+Config+as+Code&tags=story` (story id 42960713)
   - Opening line: "We have released Supabase CLI v2 today, adding support for Configuration as Code."
   - Why it worked: opens with the one-sentence fact (what shipped, today) before any framing · a pull-quote-styled definition box ("What is Configuration as Code?") sits early, teaching the concept to readers who don't already know the term — directly useful for VexCMS's own "one config → schema + types" explainer · every subsection (Auth, Edge Functions, Storage, Database, Branches) pairs one `.toml` code block with one real internal example (how supabase.com itself uses the feature), not a hypothetical · closes with install/upgrade commands and a long named-contributor list, crediting the community · length ~1,300 words (clean markdown body) · how the maker handled comments: n/a (0 HN comments) — included specifically to show that config/infra-shaped features can rank #4 in a company's own "Top 10 Launches" post yet still get almost no public discussion; don't read into a quiet feature post.

2. **Supabase — "Supabase Local Dev: migrations, branching, and observability"** — https://supabase.com/blog/supabase-local-dev — 2023-08-09 — tier 1
   - Numbers: 182 points, 52 comments on Hacker News, read 2026-11-09 from `https://hn.algolia.com/api/v1/search?query=Supabase+Branching&tags=story` (story id 37059400)
   - Why it worked: strong counter-example to #1 above — a closely related "local config → full dev environment" feature that did trend heavily, suggesting the "local dev experience" framing (not the "config file" framing) is what draws HN attention · worth reading before drafting the VexCMS post to see which framing a dev-tool audience responds to.

3. **Payload CMS — "Payload 3.0: The first CMS that installs directly into any Next.js app"** — https://payloadcms.com/posts/blog/payload-30-the-first-cms-that-installs-directly-into-any-nextjs-app — 2024-11-19 — tier 1
   - Numbers: `[UNVERIFIED]` for this exact URL; the closest matching HN submission ("PayloadCMS Just Launched v3") scored 5 points / 0 comments, read 2026-11-09 from `https://hn.algolia.com/api/v1/search?query=Payload%20CMS&tags=story` (story id 42183899); a separate, more general submission of the GitHub repo scored 214 points / 84 comments the same week
   - Why it worked: title claims a specific, falsifiable mechanism ("installs directly into any Next.js app" — i.e. one config file, zero separate server) rather than a vague superlative, the closest title-shape match to VexCMS's "one config → schema + types" story · the gap between the specific blog post (5 points) and the general repo submission (214 points) the same week is a useful data point: the *repo* trended, not the *feature announcement* — on HN, "try the thing" beats "read about the thing."

### Checklist
- Teach the underlying concept in one short, visually set-off block before showing VexCMS's own config shape.
- Pair every code sample with a real, named internal use (how vexcms.dev's own site or docs use the same config), not a hypothetical.
- Don't expect this day's post to be the week's most-discussed — config/schema features reliably get build/infra practitioners' attention more than broad social reaction.
- If driving HN traffic matters, the repo or try-it link outperforms the standalone feature post; make sure the clip and docs link both point to something try-able, not just readable.

## post:access-control-hooks-validation

Slot purpose: D4 feature post on RBAC + server-enforced hooks/validation, with a silent clip, a docs link, and links to earlier posts.
Constraints: slot format `title: …`, `excerpt: …`, blank line, markdown body (kit header). Step 9 transcribes the body into Plate JSON, and only `##` headings, paragraphs, **bold**, links and flat bullet/numbered lists map; tables, images, code fences and nested lists stop the transcription for a decision (spec step 9). Each post links its clip (`/launch/<slug>.mp4`), the fact sheet's docs page, the week's earlier posts, the `public-copy.md` Funding line and the roadmap page; no `planned`-issue links or 👍 asks (Design Decisions 12, 26; step 6).

### Examples (ranked)
1. **Directus — "Introducing Policies: A New Approach To Permissions"** — https://directus.com/resources/v11-release-notes — 2024-08-07 — tier 1
   - Numbers: 2 points, 0 comments on Hacker News, read 2026-11-09 from `https://hn.algolia.com/api/v1/search?query=Directus%2011&tags=story` (story id 40708674, titled on HN as "Directus announces v11 RC with new policy-based permissions system")
   - Opening line: "The headline feature of Directus 11 is the brand new permissions system based on policies."
   - Why it worked: states up front that this is *the* headline feature of the release, not one of several · explains the model in four short labelled bullets (Granular Control, Inheritance, Dynamic Variables, Simplified Management) before any example · follows with a single worked "real-life example" (a regional ecommerce content manager) that walks through the exact steps a reader would take, rather than abstract capability claims · closes by listing the release's other, smaller changes separately so they don't dilute the permissions headline · how the maker handled comments: n/a, zero HN comments — a caution that even a substantive access-control release can land quietly; don't assume RBAC/permissions content under-performs because of the post, it may just be a quiet topic generally.

2. **Appwrite — "Everything New in Appwrite 1.0"** (Permissions 2.0 section) — https://dev.to/appwrite/everything-new-in-appwrite-10-43o6 — 2022-09-14 — tier 1
   - Numbers: 36 public reactions, 2 comments, read 2026-11-09 from the dev.to article API
   - Opening line: "We are thrilled with the announcement of Appwrite 1.0."
   - Why it worked: access control is one section of a larger "everything new" round-up, not a standalone post — a usable alternate structure if VexCMS ever wants to bundle RBAC with other 0.1.0 items · the Permissions 2.0 section shows a before/after code diff implicitly, by simply showing the new `Permission`/`Role` class usage directly in a single compact snippet · every code sample uses a believable, named example (`actorName: 'Chris Evans'`) instead of `foo`/`bar` placeholders · closes the whole post with a "Get Involved" section pointing to Discord and GitHub issues, not a sales CTA.

3. **Convex — "Row Level Security"** (Stack by Convex) — https://stack.convex.dev/row-level-security — tier 1 (Convex-ecosystem)
   - Numbers: n/a — this is a technical explainer, not a launch post; no HN thread or reaction count found as of 2026-11-09
   - Why it worked: included because it is Convex's own canonical explanation of access control, directly relevant to VexCMS's own Convex-native RBAC story · opens with a named-author callout box from Convex's CTO stating plainly when row-level security is and isn't needed on Convex — an unusually honest, non-promotional framing worth studying · walks through one full code example (a `messages` table with author-only edit rules) end to end before generalizing · explicitly discusses the tradeoff of wrapping every `db` call vs. writing bespoke per-mutation checks, modeling how to explain a design decision instead of just a feature.

### Checklist
- Don't expect this topic to trend — all three ranked examples above drew modest-to-zero public discussion; treat a quiet comment section as normal for access-control content, not a signal.
- Lead with one short, labelled list of what the model gives you (3–4 bullets), then walk through exactly one worked, named example end to end.
- If bundling access control with other features in one post, give it its own clearly headed section rather than blending it into general prose.
- Show the actual code call shape (the permission/rule-definition syntax) directly rather than describing it only in prose.

## post:create-vexcms-to-deployed

Slot purpose: D5 feature post on `pnpm create vexcms` → a deployed site, with a silent clip, a docs link, and links to earlier posts.
Constraints: slot format `title: …`, `excerpt: …`, blank line, markdown body (kit header). Step 9 transcribes the body into Plate JSON, and only `##` headings, paragraphs, **bold**, links and flat bullet/numbered lists map; tables, images, code fences and nested lists stop the transcription for a decision (spec step 9). Each post links its clip (`/launch/<slug>.mp4`), the fact sheet's docs page, the week's earlier posts, the `public-copy.md` Funding line and the roadmap page; no `planned`-issue links or 👍 asks (Design Decisions 12, 26; step 6).

### Examples (ranked)
1. **James Mikrut — "Launch HN: Payload (YC S22) — Headless CMS for Developers"** — https://payloadcms.com/ (HN item https://news.ycombinator.com/item?id=32665325) — 2022-08-31 — tier 1
   - Numbers: 242 points, 137 comments on Hacker News, read 2026-11-09 from `https://hn.algolia.com/api/v1/search?query=PayloadCMS+Launch+Week&tags=story` (story id 32665325)
   - Opening line: "Hey HN, my name is James and I founded Payload (https://payloadcms.com/) with two close colleagues, Dan and Elliot."
   - Why it worked: names the try-it path in one sentence, late in the post but unambiguous: "You can get started in one line by running `npx create-payload-app`" · backstory (a real client project — Klarna — hitting a wall with existing CMSs) earns the right to the claim before making it · ends with an explicit invitation for technical feedback, not a generic thank-you · this is technically the founder's Launch HN, not a feature-week day post, but it is the strongest real precedent found for "scaffolder command → working app" framing landing well with a dev audience · how the maker handled comments: the founder answered in-thread across the full 137-comment discussion.

2. **Payload CMS — "Payload 3.0: The first CMS that installs directly into any Next.js app"** — https://payloadcms.com/posts/blog/payload-30-the-first-cms-that-installs-directly-into-any-nextjs-app — 2024-11-19 — tier 1
   - Numbers: `[UNVERIFIED]` for this specific post; see the one-config slot above for the related HN data points (5 points / 0 comments for this post specifically, 214 points / 84 comments for the general repo submission the same week)
   - Why it worked: the title itself *is* the try-it claim ("installs directly into any Next.js app") rather than a separate CTA tacked on — worth studying for how directly a scaffolder/install claim can sit in a headline.

3. **Eric Allam — "Launch HN: Trigger.dev (YC W23) — Open-source platform to build reliable AI apps"** — https://trigger.dev (HN item https://news.ycombinator.com/item?id=45250720) — 2025-09-15 — tier 2
   - Numbers: 162 points, 65 comments on Hacker News, read 2026-11-09 from `https://hn.algolia.com/api/v1/search?query=Trigger.dev&tags=story` (story id 45250720)
   - Opening line: "Hi HN, I'm Eric, CTO at Trigger.dev (https://trigger.dev)."
   - Why it worked: lists three concrete try-it paths side by side in one paragraph — cloud, self-host, or just read the docs — instead of a single CTA, letting the reader self-select the lowest-friction path · ends with a short, specific "here's what's coming next" list rather than a generic roadmap mention, giving the thread something concrete to react to.

### Checklist
- State the exact install/scaffold command in plain text early, not buried after several paragraphs of narrative.
- If the backstory supports it, ground the "why we built this" claim in one specific, concrete scenario rather than a general pain-point statement.
- Offer more than one way to try it (cloud/hosted path and self-host/local path) when VexCMS genuinely has both, rather than forcing one funnel.
- Close with a specific, short "what's next" list rather than a vague roadmap mention — it gives readers something concrete to respond to.

## page:launch-week

Slot purpose: recap page — title, hero badge, hero heading/subheading, CTA heading/subheading, 5 action links to the week's posts.
Constraints: fields `title:`, `hero.badge:`, `hero.heading:`, `hero.subheading:`, `cta.heading:`, `cta.subheading:`, then five `action:<label>|<href>` lines (kit header); a compact Hero + CTA page, no footer entry (Design Decision 10).

### Examples (ranked)
1. **Supabase — Launch Week 13 hub** — https://supabase.com/launch-week/13 — live Dec 2024 — tier 1
   - Numbers: n/a (hub page, no reaction count)
   - Why it worked: structure is day-tab navigation (Mon–Fri plus Build Stage/Hackathon/Meetups/Ticket tabs) at the very top, letting a visitor jump to any day without scrolling · the companion recap post, "Top 10 Launches of Launch Week 13" (https://supabase.com/blog/launch-week-13-top-10), is a *separate* page from the hub itself — the hub is the live/structural page, the numbered recap is the narrative wrap-up, a two-page pattern worth noting since VexCMS's `page:launch-week` slot combines both roles into one page · the recap post opens with a one-line joke-hook ("You won't believe #7") then numbers every launch 1–10 with a one-sentence description and a "Read more →" link each, closing with a "Launch Week continues" section pointing at the following week's events.

2. **Dub — "Launch Week Recap: Celebrating 1 year of Dub"** — https://dub.co/blog/launch-week-recap — 2025-01-24 — tier 2
   - Numbers: 900+ paying customers, 1M+ links created, 150M+ clicks tracked, 5,500+ domains, 70,000+ users — company metrics stated in the post itself (not launch-week engagement numbers), read 2026-11-09 from the live page; per-day social numbers (Day 1: 493 likes/70 reposts/155K impressions; Day 2: 35 likes/11 reposts/10K impressions; Day 3: 11 likes/1 repost/2K impressions) read 2026-11-09 from `https://launchweek.dev/lw/n/dub.md`
   - Why it worked: opens with a one-sentence summary naming all three announcements before any per-day detail ("We launched 3 big announcements this week: ...") · a linked table of contents sits directly under the opener (`[Day 1: ...](#day-1-...)` for each day) · each day section embeds that day's own demo clip/thumbnail inline rather than only linking out · closes by pairing the launch-week wrap-up with an unrelated milestone (the company's 1-year anniversary) and a forward-looking "what we're focused on next" numbered list · per-day engagement dropped sharply from Day 1 to Day 3 (493 → 35 → 11 likes) per launchweek.dev's analysis — a caution that a recap page's later-week links will usually get less traffic than the first.

3. **Resend — "Launch Week 1: Wrap Up"** — https://resend.com/blog/launch-week-1-wrap-up — 2023-03-13 — tier 2
   - Numbers: n/a (wrap-up post, no reaction count found); read 2026-11-09
   - Why it worked: identical table-of-contents-then-per-day-section structure to Dub's, but every day's entry is deliberately terse — one sentence of description, then two to four flat links ("Read the announcement", "Go to the dashboard", "See a code example", "Browse the docs") with no prose beyond that · total length ~520 words for 7 days, proving a recap page does not need to re-summarize each feature at length since the day posts already did that job · closes with a two-sentence "Looking forward" paragraph, no action items.

4. **Trigger.dev — Launchweek 2 hub** — https://trigger.dev/launchweek/2 — Aug 2025 — tier 2
   - Numbers: n/a (hub page)
   - Why it worked: hero is a single sentence ("An entire week of new feature announcements") plus the date range, no separate badge/subheading split · each day is one card: a weekday name, a one-line feature title, a one-sentence description, a "Blog post" link, and — only where relevant — a second "View Docs" link · every card stays visible on the hub page simultaneously (no day-by-day reveal), so the whole week's shape is visible in a single screen, which is the closest structural match to a 5-action-link recap page.

### Checklist
- Keep the hero to one sentence plus a date range; don't split hype across a badge, heading, and subheading when one line will do.
- List all five day-links on one screen rather than requiring a click-through per day.
- Give each action link a one-sentence description, not just a bare title — every example above pairs title + one sentence + link.
- Expect per-day engagement to taper across the week (first-day numbers consistently highest in the data found); don't treat a quieter Day 5 link as evidence the page failed.
- A separate, narrative "top N" recap post is optional and distinct from the hub page itself in the strongest example found (Supabase); the VexCMS page combines both roles, so keep the per-day one-liners factual (what shipped) rather than purely celebratory.

## Research notes

**Product Hunt — Process notes for Main**

- No repository files were edited, no dev servers run, no git/pnpm commands issued — the only write was this `local://lpe-ph.md` file, per the coordination rules.
- One false assumption in the task brief worth flagging: the brief's example list for the maker-writeup guide included "Trigger.dev founders' posts on what worked" — no such dedicated writeup could be found (only a secondhand podcast/interview quote with no PH-specific detail); Dub.co's and Supabase's writeups were used instead, both of which are directly dev-tool/BaaS and same-platform (tier 1–2) per the selection priority.
- PH product/forum pages (`producthunt.com/products/*`, `producthunt.com/p/*`) consistently return HTTP 403 on direct fetch; all PH-sourced numbers and quotes in this file came either from the `hunted.space` third-party PH-data mirror (which embeds PH's own API responses, including full maker-comment text in at least one case) or from search-engine-indexed snippets of the PH pages themselves, each marked in the ledger above.

**LinkedIn and Discord — Notes on false assumptions / coordination**

- The brief suggested Astro's/Supabase's "Discord showcase rules" as a guide source. I could only retrieve Supabase's actual rule text (via LaunchWake, a third-party channel-rules aggregator, cross-checked against a #showcase mention from an independent recap page) — I could not access Astro's Discord rules text directly (Discord content isn't crawlable, and no third-party aggregator page for Astro's server surfaced in search), so no Astro-specific rule text is cited; astro.build/showcase (a public gallery, not Discord) was found but not used since it doesn't describe channel etiquette.
- Discord content for Convex's own server (and for any other server) is not independently readable by this agent; Answer Overflow, which indexes some Discord servers into readable web pages including Convex's, returned HTTP 429 on every attempt and was not used as a source. All discord:d1 examples are therefore GitHub Discussions analogues, each tier-labeled and flagged where the match to "reply in an existing thread" is imperfect.
- No repository files were edited, no dev servers run, and no git state-changing commands were issued; the only file written is this one, at the `local://` path given in the assignment.

**Launch guides — Cross-guide consensus**

(Points at least 3 of the 9 guides above independently agree on.)

- **Never ask for, pay for, or orchestrate upvotes/comments.** Stated as a hard, bolded rule by both Product Hunt guides (#3, #4), reaffirmed by dang/HN (#7, consistent with the broader HN rules already logged in `sources.md` §1.2–§1.4), and implicit in how Plausible (#9) and PostHog (#8) describe their organic results.
- **Make the thing itself easy to try, with minimal signup friction, before you post anywhere.** dang/HN (#7: "needs to actually exist and there needs to be a way for people to try it out"), Markepear (#6: "give people an easy way to try it out, for free"), Product Hunt (#4: use the product itself to answer questions/demo), Supabase (#1: code frozen and tested a week before launch day).
- **Show up and answer comments fast, in your own voice, for the whole launch window.** Product Hunt (#4: "be there... reply to comments quickly"), Markepear/dang (#6, #7: answer fast, agree with intent first), PostHog (#8: retention/engagement framing), Supabase (#1: the engineer who built the feature is also the one who answers for it).
- **Drop marketing/sales language; lead with backstory, problem, and what's different.** dang (#7), Markepear (#6), echoed by Supabase's practice of having the builder (not a marketer) write the technical write-up (#1).
- **Build an audience/email list before you need it, continuously, not starting on launch day.** YC (#5: build the list from every interaction), Product Hunt (#3: "the makers who do best... started weeks earlier"), Plausible (#9: 4 months of audience-building before their PH launch).
- **Treat the launch as the start of a measurement/retrospective loop, not the end.** Supabase's formal retrospective (#1), Product Hunt's "compare your results with the goals you set before launch" (#4), PostHog's weekly post-mortems (#8), Plausible's referral/conversion breakdown after the fact (#9).

**Launch guides — Disagreements**

- **Does the product need to be real and finished before you launch, or is a landing page itself a valid "launch"?** YC's Kat Mañalac (#5) explicitly endorses a "silent launch" — just a domain, name, short description, and a CTA — as a legitimate early launch type to start collecting signal. dang/HN (#7) and Product Hunt (per `sources.md` §2.8, "We only feature products that are currently available") explicitly rule this out for their own channels: HN Show-posts and Product Hunt listings must be a tryable, working product, not a landing page or market test.
- **Warn your audience in advance, or launch in total silence?** Product Hunt's own guide (#3) lists "give your people a heads-up" (email list, team, social prep) as a checklist item days/weeks ahead of launch, and Supabase (#1) runs a whole pre-launch week of coordinated prep. Plausible (#9), by contrast, launched on Product Hunt with zero advance notice to anyone — "we told nobody... until our listing was live" — and still had a top-of-day result, treating secrecy as the better call for their launch.
- **Does the specific person who "hunts"/submits your product matter?** Older/folk launch advice (cited inside Plausible's own post, #9, attributed to a third party: recruit a well-known hunter such as Chris Messina to submit for you) treats hunter identity as a lever worth pulling. Product Hunt's current mechanics, quoted in that same post, say otherwise: hunter-follower notifications were discontinued, so "it makes very little difference who hunts the product."

**Launch guides — Notes / false assumptions corrected**

- The brief suggested "Resend founder posts on their launches." Searched specifically for a Zeno Rocha essay on how Resend was launched; found only the Launch HN thread itself (an example, not a guide) and third-party recaps/podcasts (`bestofshowhn.com`, `betterlaunch.co`), none of which are a founder-authored guide. Substituted launchweek.dev's direct Zeno Rocha quotes (#2) plus PostHog's (#8) and Plausible's (#9) founder-authored launch retros, which do fit "founder posts on their launches."
- Product Hunt's top-level "Launch Guide" index page (https://help.producthunt.com/en/articles/17350772-launch-guide) 404s even though it's linked from search results and other PH help pages; the individual numbered sub-articles (used here, #3/#4) load fine. Future fetches of this index should go straight to a numbered sub-article URL.
- launchweek.dev's individual company pages (`/p/<slug>`) and the "launch on Product Hunt" cross-promo page 404 as of this fetch, despite being indexed by search; only `/lw/faq.md` resolved. If a future pass needs a specific company's launch-week breakdown from that site, re-check the current URL scheme first (it may have moved under a different prefix).
