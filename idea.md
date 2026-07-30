# idea.md — shaan.wiki

Living ideation doc. Nothing here is final. Sections marked **[OPEN]** need Shaan's input.

Last updated: 2026-07-31 (Day 3)

---

## 1. The pitch

**shaan.wiki is a one-year writing machine with a death clock on it.**

Shaan bought the domain on 29 July 2026. It expires on 29 July 2027. That's 365 days.
For each of those days he writes one thing and ticks whether he went to the gym.
Every entry becomes a permanent page in a wiki. At the end, the site is an archive of a year —
365 articles, 365 squares, one number counting down to zero the whole time.

The constraint isn't decoration. **The domain expiry is the deadline, and the countdown is the masthead.**

## 2. Hard requirements (from Shaan, non-negotiable)

1. **Vanilla HTML / CSS / JS.** Lightweight, extremely fast-loading. No framework.
2. **Black and white only.** Genuine requirement, not a preference.
3. **Minimal, encyclopedia-like.** Wikipedia as a structural reference, stripped further.
4. **Write from the website itself.** After setup, Shaan never opens a code editor again.
   He goes to the site, types, hits save, and it's live.
5. **One password.** Not OAuth, not accounts. A single passphrase that unlocks writing.
6. **Every entry is a text file.** Plain text/markdown is the storage format. No database of record.
7. **URL = title.** `shaan.wiki/<title-slug>`. Date access as well.
8. **Countdown timer** to domain expiry, based on the real expiry date.
9. **Gym tracker.** Binary tick per day, rendered as a GitHub-style contribution grid.
10. **365-day archive** is the end product.

## 3. Ground truth

```
Domain          shaan.wiki
Registrar       Spaceship, Inc.
Registered      2026-07-29 19:48:39 UTC
Expires         2027-07-29 19:48:39 UTC
Nameservers     launch1/launch2.spaceship.net  (parked — nothing served yet)
Today           2026-07-31  →  Day 3, ~363 days remain
Repo            github.com/Shaan-kapoor/shaan-wiki  (private)
```

GitHub rejects repo names ending in `.wiki`, hence `shaan-wiki`. Doesn't affect the domain.

## 4. The central problem: a static site that writes to itself

Everything else is easy. This is the part that decides the architecture.

GitHub Pages serves files. It cannot accept a POST. So "type in the browser → it's saved forever"
needs something to turn a form submission into a committed file. Three real options:

### Option A — Browser commits directly to GitHub
The `/write` page holds a fine-grained GitHub token (encrypted with the passphrase, stored in
`localStorage`). On save it calls the GitHub Contents API and commits the file itself.

- ✅ Zero infrastructure. Zero cost. Nothing to maintain.
- ✅ Ships fastest.
- ❌ A repo-write token lives in the browser. Scoped to one repo, contents-only, so worst case is
  someone defaces the wiki and git history undoes it — but it's a real token in a real browser.

### Option B — A tiny Cloudflare Worker as a commit proxy ★ recommended
Browser POSTs `{passphrase, title, body}` to a ~40-line Worker. The Worker checks the passphrase
against a hash, then commits to GitHub using a token held as a **server-side secret**.

- ✅ No token ever reaches the browser. The password is checked where it should be.
- ✅ Free tier is enormous — 100k requests/day. This will use ~2.
- ✅ Rate limiting, and the write endpoint can be locked down properly.
- ❌ One extra thing to deploy. Once. Then never again.

### Option C — No git, database instead (Cloudflare D1/KV)
Entries live in a database, rendered at the edge.

- ✅ Instant saves, no rebuild wait.
- ❌ Breaks requirement #6 — the archive stops being plain text files in a repo you own.
  Loses git history, loses "download the whole year as a folder."

**Recommendation: B.** Requirement #6 says the archive is text files, which means git is the
source of truth, which means we need a commit path, which means a secret needs a home.
A Worker is the smallest correct home for it.

### What this means for "no build step"

The reader still gets pure static HTML. But a **GitHub Action** runs on every push to `entries/`
and regenerates the site: one HTML page per entry, the index, the grid, the search index, the RSS.

The build step exists — it just runs on GitHub's machines, never on Shaan's.
That satisfies "I never come back to coding" while keeping the site JS-free for readers.

**Publish latency:** ~30–60s from hitting save to the page being live. The write page can show
the rendered entry immediately so it never *feels* like waiting. [OPEN Q6]

## 5. How a day works

```
  1. Open shaan.wiki/write on phone or laptop
  2. Passphrase (remembered on the device — typed once, then never again)
  3. Title  →  becomes the URL
  4. Write. Autosaves to localStorage continuously so nothing is ever lost.
  5. [ ] Gym today?          ← one tap
  6. Save
       ↓
  Worker commits  entries/2026-07-31-title.md  +  updates  data/gym.json
       ↓
  Action rebuilds  →  live at  shaan.wiki/title  in under a minute
```

## 6. Storage layout

```
entries/
  2026-07-29-first-entry.md
  2026-07-30-on-buying-a-domain.md
  ...
data/
  gym.json          { "2026-07-29": true, "2026-07-30": false, ... }
  meta.json         day numbers, streaks, word counts — derived, regenerated by CI
```

Entry file format:

```markdown
---
title: On buying a domain
date: 2026-07-30
day: 2
gym: true
tags: [domains, writing]
---

Body text. Wikilinks like [[On buying a domain]] resolve to real links at build time.
```

Frontmatter is the only structure. Everything else — the index, the grid, backlinks,
word counts, streaks — is **derived**, so it can be regenerated from scratch at any time.
Delete the whole site and the `entries/` folder rebuilds it. That's the durability guarantee.

## 7. URLs

```
/                      home — countdown, gym grid, latest entry, recent list
/<title-slug>          an entry            shaan.wiki/on-buying-a-domain
/<title-slug>.txt      the raw source of that entry, plain text
/day/2                 same entry by day number
/2026/07/30            same entry by date
/archive               all 365 slots, filled and empty
/archive.txt           the entire year as one downloadable text file
/gym                   the grid, full size, with streak stats
/tag/<tag>             entries by tag
/wanted                wikilinks pointed at pages that don't exist yet — a writing backlog
/random                jump somewhere
/colophon              how this thing is built
/write                 the password-gated writing surface
/feed.xml              RSS
```

Title collisions get `-2` appended. Renaming a title later leaves a redirect stub behind,
because a wiki that breaks its own links is a broken wiki.

## 8. Black and white — how to make monochrome not look unfinished

Only three values in the whole site: `#000`, `#fff`, and greys strictly for structure
(hairlines, the empty state of grid squares). No accent colour anywhere.

Everything colour would normally do gets done another way:

- **Hierarchy** → type size, weight, and letter-spacing. Nothing else.
- **Emphasis** → a full black fill with white text. Used sparingly, it hits harder than any colour.
- **Links** → underlined, `text-underline-offset` tuned. Visited links get a subtler underline,
  not a different hue.
- **Rules** → 1px hairlines. Wikipedia's underlined headings, but thinner and with more air.
- **Dark mode** → a true inversion. Black and white is the one palette where flipping is exact.
- **Images** → 1-bit dithered (Floyd–Steinberg / halftone). A dithered photo is tiny, loads
  instantly, and looks intentional in a way a greyscale photo never does. [OPEN Q9]
- **Texture** → the only ornament available is density: how tight the grid is, how heavy the rule,
  how much whitespace. This is a real design language, and monochrome forces us to be good at it.

The whole stylesheet should fit in one screen and inline into `<head>`.

## 9. The gym grid — and a better idea

GitHub's grid is 53 weeks × 7 days, coloured by intensity. Gym attendance is binary,
so intensity is wasted. But there are **two** daily signals here: *did I write* and *did I go*.

So: **one grid, four states, encoded without colour.**

```
  ██   both — wrote and went              solid black
  ◨    wrote only                         left half filled
  ◧    gym only                           right half filled
  ·    neither — a day that got away      1px outline, empty
  ␣    the future                         nothing, faintest hairline
```

One square per day, 365 of them, in a 53×7 lattice. Hover (or tap) a square → the entry title
and date. Click → the entry.

This is the single image of the year, and it's the thing people will screenshot.
It's also achievable in pure CSS with a `conic-gradient` per state and no JS.

**Alternative if that reads as too clever:** two separate grids stacked, one for writing,
one for the gym. Less elegant, more legible. [OPEN Q7]

## 10. The countdown

Top of every page, in the masthead:

```
   D A Y   0 0 3   ·   3 6 2   D A Y S   R E M A I N
   ────────────────────────────────────────────────
```

Ticks live in JS against the real expiry timestamp `2027-07-29T19:48:39Z`. Server-rendered
into the HTML too, so it's correct with JS off.

Design question: is the countdown **days** (calm, monumental) or **days:hours:minutes:seconds**
(urgent, ticking)? Seconds make it a performance piece. Days make it a fact. [OPEN Q8]

**And the real question — what happens at zero?** Three genuinely different endings:

- **Renew.** Year Two begins, the grid resets, the archive stays. The countdown was a rhythm.
- **Freeze.** The site is renewed but locked. 365 entries, no more writing, permanent monument.
- **Let it die.** The archive is exported, the domain lapses, the URL goes dark.
  The most artistically pure and the one nobody actually does.

This doesn't need answering now, but the site should be *designed* as though the ending matters,
because that's what makes the countdown mean anything. [OPEN Q10]

## 11. Rules of the game **[OPEN Q3]**

These are the project's ethics and they're worth deciding on purpose:

- **Can you backfill a missed day?** If yes, the grid is a to-do list. If no, the grid is a record.
  *Strong opinion: no backfilling.* A gap you can never fill is what makes the streak worth
  anything. A softer version: backfill is allowed but the square renders differently forever
  and the entry is stamped "written late."
- **Can you edit an entry after posting?** Yes — it's a wiki, and git keeps every version anyway.
  Each entry links to its own revision history on GitHub.
- **Can you delete one?** Suggestion: no delete, only "retract" — the page stays, the body is
  struck through. Wikis don't memory-hole.
- **Is there a minimum length?** A one-sentence day still counts. Zero words doesn't.
- **What's the day boundary?** Needs a timezone. Midnight IST, presumably — and a grace period,
  because writing at 1am about the day that just ended is the normal case, not the exception.
  *Suggestion: the day ends at 4am local.* [OPEN Q2]

## 12. Ideas worth stealing from real wikis

1. **Wikilinks + backlinks.** Write `[[Something]]` in an entry; the build resolves it to a link
   and adds a *"What links here"* section to the target page. **This is the feature that makes it
   a wiki instead of a blog**, and it's ~30 lines in the build script.
2. **Wanted pages.** Every `[[link]]` to a page that doesn't exist yet gets listed at `/wanted`.
   You've just built a writing-prompt generator out of your own unfinished thoughts.
   This might be the best idea in this document.
3. **Stub notice.** A page that's under ~50 words renders *"This entry is a stub."* Honest, and
   the same joke Wikipedia has been making for 25 years.
4. **Revision history.** Every entry footer: "Last edited on X · view all revisions" → GitHub.
5. **`[edit]` links per section** that deep-link into `/write` with that entry loaded.
6. **Talk pages.** `/talk/<entry>` — where you argue with your own past position.
   The most honest thing a personal site can contain.
7. **Disambiguation joke.** `/shaan` → "Shaan may refer to:"
8. **Citations.** Claims about your own life footnoted to the commit, tweet, or receipt that
   proves them. Turns autobiography into something falsifiable.

## 13. Vanilla-platform tricks this design gets to use

- `popover` + `anchor-name` / `position-area` → Wikipedia-style hover previews on wikilinks.
  **Zero JS.** This is the "how did you do that" feature.
- `@view-transition` → a multi-page static site that navigates like an app, no router.
- `<details>` / `:target` → collapsibles and panels with no script.
- `content-visibility: auto` → the 365-entry archive page stays instant.
- CSS counters → auto-numbered footnotes and sections.
- `animation-timeline: view()` → reading progress bar, off the main thread.
- `text-wrap: pretty` / `balance` → typography that fixes itself.
- Print stylesheet → the year prints as a book. Genuinely worth doing at day 365.
- Service worker → `/write` works offline on a plane and commits when you're back. [OPEN Q6]

## 14. Things that make the project actually survive 365 days

The failure mode isn't technical, it's **day 40, when you're tired and it's 11:40pm.**
Design for that:

- **The write page must be superb on a phone.** Most entries will be typed on a phone in bed.
  This is the primary interface, not the desktop one.
- **Autosave to localStorage on every keystroke.** Never lose a draft. Non-negotiable.
- **One tap for the gym tick.** Ideally without opening the editor at all.
- **Installable as a PWA** so it's an icon on the home screen, not a bookmark.
- **A nightly nudge.** A GitHub Action cron at 9pm that pings you if nothing's written yet —
  email, or a push notification. Unglamorous, and probably the highest-leverage feature here. [OPEN Q5]
- **Never show a spinner.** Optimistic UI: the entry appears saved instantly, syncs behind you.

## 15. Non-goals

- No comments, no likes, no share buttons, no analytics dashboard.
- No CMS, no admin panel, no database of record.
- No cookie banner, because there'll be nothing to consent to.
- No colour. Not even one accent. Not even for links.
- No JS required to *read* anything.
- No dependencies. No npm at runtime, no CDN, no webfont fetch.

## 16. Budget

- Home page: **under 20 KB** total, including inlined CSS. One request to first paint.
- Entry page: under 15 KB.
- Archive page (365 entries listed): under 60 KB.
- Every page must be usable on 3G and readable with JS disabled.
- Footer flexes it: *"This page is 11.4 KB and made 1 request."*

---

## 17. Open questions **[OPEN]**

**Q1 — Public or private?**
Is the writing public from day one, or is this a private journal that only you read?
This changes almost everything: tone, whether the repo is public, whether Pages needs a paid plan,
and whether entries need a `private: true` flag to stay out of the build.

**Q2 — Timezone and day boundary.**
IST, presumably? And when does a day end — midnight, or ~4am so that late-night writing counts
for the day it's about?

**Q3 — The rules.** Backfilling missed days: allowed, forbidden, or allowed-but-marked?
(See §11 for the full set — this is the one that matters most.)

**Q4 — What do you write?**
Freeform whatever-comes, or a fixed shape (a thought, a thing learned, a log)? Fixed shapes are
easier to sustain on a bad day; freeform is better on a good one. Also: rough length target —
a paragraph, or a page? This determines whether the archive reads as notes or as essays.

**Q5 — Do you want the 9pm nudge?** And by email, push, or not at all?

**Q6 — Offline writing.** Worth building the service worker so `/write` works with no signal,
or is "you'll have wifi" a safe assumption?

**Q7 — One combined grid (four states) or two separate grids?** (§9)

**Q8 — Countdown: days only, or a live ticking clock with seconds?** (§10)

**Q9 — Any images at all?** A dithered photo of you in an infobox, images inside entries,
or is this strictly a text-only site forever?

**Q10 — What happens on day 365?** Renew, freeze, or let it die. (§10)

**Q11 — Hosting.** Recommended: **Cloudflare Pages + a Cloudflare Worker**, with GitHub as the
archive. It's free, it handles a private repo without a paid plan, and the Worker and the site
live in one place. The alternative is GitHub Pages + a Worker, which means two dashboards.
Either way, you'll need to point `shaan.wiki` off Spaceship's parking nameservers. Any preference,
or do you want me to pick?

**Q12 — Does the gym tick need a history edit?** i.e. if you forget to tick on Tuesday,
can you fix it on Wednesday? (Same philosophical question as Q3, smaller stakes.)

---

## 18. Parking lot

- Word-count bar chart across the year — a monochrome skyline of how much you wrote each day.
- Total stats in the footer: words written, days elapsed, longest streak, gym percentage.
- `curl shaan.wiki` returns a nicely formatted plain-text version. Because it should.
- Schema.org `Person` JSON-LD — a wiki about a person that machines can read.
- `/api/shaan.json` — the whole archive as structured data.
- A "year in review" page auto-generated on day 365.
- Full-text search over the archive, `/` to focus, from a generated index.
- Export the year as a single PDF laid out for print.
