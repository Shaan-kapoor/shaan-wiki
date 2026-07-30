# idea.md — shaan.wiki

Living ideation doc. **[LOCKED]** = decided. **[OPEN]** = needs Shaan.

Last updated: 2026-07-31

---

## 1. The pitch

**shaan.wiki is a one-year writing machine with a death clock on it.**

Shaan bought the domain on 29 July 2026. It expires on 29 July 2027. That's 365 days.
Each day he writes one thing and ticks whether he went to the gym.
Every entry becomes a permanent page. At the end, the site is the archive of a year —
365 articles, 365 squares, and a number that counted down to zero the whole time.

The constraint isn't decoration. **The domain expiry is the deadline, and the countdown is the masthead.**

## 2. Ground truth

```
Domain          shaan.wiki
Registrar       Spaceship, Inc.
Registered      2026-07-29 19:48:39 UTC
Expires         2027-07-29 19:48:39 UTC   ← the countdown target
Nameservers     launch1/launch2.spaceship.net  (parked — nothing served yet)
Repo            github.com/Shaan-kapoor/shaan-wiki  (private for now)
```

GitHub rejects repo names ending in `.wiki`, hence `shaan-wiki`. Doesn't affect the domain.

## 3. Decisions **[LOCKED]**

| # | Decision | Consequence |
|---|---|---|
| 1 | Vanilla HTML/CSS/JS, no framework | No build tooling on Shaan's machine, ever |
| 2 | Black and white only | No accent colour, not even for links |
| 3 | Write from the site itself | After setup, no code editor is ever opened again |
| 4 | One password | Not OAuth, not accounts |
| 5 | Entries are plain text files | Git is the archive and the source of truth |
| 6 | `shaan.wiki/<title>` | Title determines the URL |
| 7 | Countdown to domain expiry | Real timestamp, on every page |
| 8 | Gym tracker, binary tick | Gym only. No writing grid |
| 9 | Public — anyone can read | Repo goes public |
| 10 | No backfilling | A missed day stays missed. The grid is a record |
| 11 | Mobile-first | The phone is the primary writing device |
| 12 | **Grid = full year, 53×7, GitHub's shape** | Built as a `<table>`. See §7 |
| 13 | **Read _and_ write on Kindle** | The hardest constraint. It decides the architecture. See §5 |
| 14 | **One HTML file per thing** | Components and pages are separate source files. See §6 |

**Reopened:** #10 from the previous round — *browser commits straight to GitHub* — is off the
table. Wanting to write from the Kindle kills it. See §4.

---

## 4. The write path — options

You asked what the options actually are. Here they are, and the Kindle decides between them.

### The thing that changes everything

An old Kindle browser may not have `fetch`, may have broken CORS, and almost certainly has no
`crypto.subtle` for encrypting a token in `localStorage`. Any JavaScript-driven save is a coin flip.

But **a plain `<form method="post">` needs no JavaScript at all.** No fetch, no XHR, no CORS,
no WebCrypto. It has worked in every browser since 1995.

So the requirement "I want to write from my Kindle" reduces to: **something must be able to
receive a POST.** Every option below is judged on that.

---

### Option 1 — Cloudflare Pages + Pages Functions ★ recommended

Site and write-endpoint in one deploy, one dashboard, one vendor.

```
/write            static HTML, a plain <form method="post" action="/api/write">
   ↓ POST         password · title · body · [ ] gym
/api/write        a Pages Function (~60 lines)
                    · checks the password server-side, constant-time, rate-limited
                    · commits entries/2026-07-31-title.md via the GitHub API
                    · 302 → /saved
   ↓ push
GitHub            the archive. Push triggers a Cloudflare Pages build
   ↓ ~40s
shaan.wiki/title  live
```

- ✅ **Works with JavaScript completely disabled.** This is the only property that matters for the Kindle.
- ✅ The password is a real password again — checked on a server, no token pasting per device.
- ✅ **You can lower the minimum TLS version to 1.0.** This is the decisive one — see below.
- ✅ Free. The free tier is 100k function calls/day; this will use about two.
- ✅ Secrets live server-side. Nothing sensitive ever reaches a browser.
- ✅ One `git push` deploys everything. No separate Worker to maintain.
- ❌ One Cloudflare account to set up, once. Nameservers move off Spaceship.

### Option 2 — GitHub Pages + a Cloudflare Worker

Same shape, but hosting stays on GitHub Pages and the Worker handles only the POST.

- ✅ GitHub Pages is familiar.
- ❌ **GitHub Pages controls its own TLS and you cannot lower it.** If your Kindle can't negotiate
  a modern handshake, the *reading* site is unreachable and a working write endpoint doesn't help.
- ❌ You need the domain on Cloudflare DNS anyway to route the Worker — so you end up with both
  vendors regardless, and two dashboards instead of one.
- ❌ Two deploy systems to keep in sync.

Strictly worse than Option 1 unless you specifically want GitHub Pages.

### Option 3 — GitHub Actions only

Your suggestion, and it's worth answering properly: **Actions is a builder, not a receiver.**

There is no way to POST to a repository from an anonymous HTML form. `repository_dispatch` and
`workflow_dispatch` both require a token — which puts the token back in the browser, which is
exactly what the Kindle can't do.

The one server-free variant that genuinely works: **write entries as GitHub Issues**, and have an
Action convert each new issue into a file. Clever, zero infrastructure — but you'd be writing
inside GitHub's web UI, which is far too heavy for a Kindle, and it fails requirement #3, which is
that you write *on your own site*.

**Verdict: keep Actions, but for the right job.** It's the right tool for the nightly nudge cron
and for any scheduled maintenance. It cannot be the write endpoint. Both things you said make
sense — they're just different jobs, and we need one of each.

*(If we host on Cloudflare Pages, Cloudflare runs the site build itself, so Actions may end up
doing nothing but the 9pm nudge. That's fine — it's still the right tool for that.)*

### Option 4 — browser commits directly to GitHub

The previous round's pick. Now effectively dead: it needs `fetch` or XHR **plus** working CORS
**plus** WebCrypto, on a browser where all three are doubtful. If any one is missing, writing from
the Kindle is impossible.

Still the fastest thing to ship if you ever drop the Kindle-writing requirement. Noted, not chosen.

### Option 5 — email-to-entry

Cloudflare Email Workers can receive an email and commit it. Lovely as a *second* path — write from
anywhere, no browser at all — but the Kindle can't easily send mail, so it doesn't solve this.
Parking lot.

---

### Recommendation

**Option 1.** It's the only one that satisfies "write from a Kindle," it restores the true
one-password login you originally asked for, it's free, and it's one dashboard instead of two.

### The TLS argument, spelled out

This is the concrete reason to prefer Cloudflare over GitHub Pages, and it's worth understanding
because it may be the difference between the Kindle working and not working at all.

Old Kindles negotiate old TLS. GitHub Pages gives you no control over the handshake — take it or
leave it. Cloudflare lets you **set the minimum TLS version down to 1.0**, and lets you decide
whether to force an HTTPS redirect at all. If your Kindle is a 2014-era Paperwhite, that setting is
very likely the thing that decides whether `shaan.wiki` loads on it.

We don't yet know which Kindle you have, so we don't know if this matters. But choosing Cloudflare
costs nothing and keeps the option open, and choosing GitHub Pages closes it permanently.
**[OPEN Q1]**

### A refinement worth considering

The Function could commit the markdown **and** a minimal generated HTML page for that one entry, so
the entry is live the instant you hit save. CI then regenerates everything properly a minute later.
Removes the only waiting in the whole flow. Slightly more code in the Function. **[OPEN Q5]**

---

## 5. Writing on the Kindle

You want to write there, so it's a target, not a nice-to-have. What that costs:

**The editor must be a plain form that works with zero JavaScript.**

```html
<form method="post" action="/api/write">
  <input type="password" name="key">
  <input type="text" name="title">
  <textarea name="body"></textarea>
  <label><input type="checkbox" name="gym"> Went to the gym</label>
  <button name="action" value="draft">Save draft</button>
  <button name="action" value="publish">Publish</button>
</form>
```

That's it. That renders and submits on a 2012 browser.

Everything else is enhancement layered on top **only where it's supported**:

| Feature | Phone | Kindle |
|---|---|---|
| Plain form submit | ✅ | ✅ |
| Autosave to `localStorage` every keystroke | ✅ | ❌ — no JS assumed |
| Live word count, live countdown | ✅ | ❌ |
| PWA home-screen icon | ✅ | ❌ |
| Offline drafting | ✅ (service worker) | ❌ |

**The Kindle risk is losing a long entry to a browser crash with no autosave.** The mitigation is
the *"Save draft"* button above — a second submit action that commits to a `drafts/` path.
No JS, works everywhere, and it's the honest answer to "how do I not lose my writing on a Kindle."
Hit it every few paragraphs out of habit.

Realistically the Kindle keyboard will keep entries short there, which is fine — a short entry
still fills the square.

### Other Kindle rules, restated

Gone from the design, permanently: CSS Grid, flexbox as load-bearing layout, `:has()`, `popover`
hover-previews, view transitions, animation, hover states, sidebars, floated infoboxes, web fonts,
custom properties in critical CSS.

Base layer is HTML that reads correctly with no CSS at all, then simple CSS everything supports,
then modern CSS strictly inside `@supports` as garnish.

Every one of those constraints points the same way as the things you already chose. **If it looks
right on e-ink, it's right.**

---

## 6. File structure — one file per thing **[LOCKED]**

Per your call: no monolithic HTML. Every page and every component is its own source file, and the
build assembles them. HTML has no native include, so this is precisely what the build step is for.

```
src/
  pages/
    index.html          home — countdown, grid, latest entry
    entry.html          template for a single entry
    archive.html        all 365 slots
    gym.html            full grid + month blocks + stats
    write.html          the editor
    colophon.html       how it's built
    404.html
  components/
    head.html           meta, inlined critical CSS
    masthead.html       the countdown
    gym-grid-year.html  ← the 53×7 grid, its own file
    gym-grid-month.html ← month blocks, its own file
    gym-stats.html      streaks and percentages
    entry-list.html
    footer.html
  css/
    base.css            works on everything, including the Kindle
    enhance.css         modern-only, wrapped in @supports
  js/
    countdown.js        enhancement only
    editor.js           autosave, word count — enhancement only

entries/                the archive. Plain markdown. The source of truth
  2026-07-29-first-entry.md
drafts/                 unpublished, committed by the "save draft" button
data/
  gym.json              { "2026-07-29": true, ... }

functions/
  api/write.js          the Cloudflare Pages Function

build/
  build.py              ~150 lines, no dependencies

mockups/                throwaway explorations, one file per idea
public/                 build output — what actually gets served
```

Templating stays deliberately stupid: `{{> components/gym-grid-year.html }}` for an include and
`{{ title }}` for a value. No template language, no dependencies, no npm.

**The source is many files; the output is few.** The build inlines critical CSS into each page so a
reader still gets one request and one file. Splitting the source is for us; the reader gets the
monolith. That's the whole reason a build step exists.

---

## 7. The gym grid **[LOCKED — variant A]**

Full year, 53 columns × 7 rows, weeks as columns, GitHub's shape, built as a `<table>`.

```
        Aug    Sep    Oct    Nov    Dec    Jan    Feb ...
   Mon  ■ ■ □ ■ ■ □ ■ ■ ■ □ ■ · · · · · · · · · · · ·
   Wed  □ ■ ■ ■ □ ■ ■ ■ □ ■ ■ · · · · · · · · · · · ·
   Fri  ■ ■ □ ■ ■ □ ■ ■ ■ ■ □ · · · · · · · · · · · ·

   ■ went    □ didn't    · not yet
        91 of 213 days · current streak 6 · longest 19
```

Three states: solid black (went), 1px outline (didn't), faint outline (hasn't happened yet).
Today's square gets a ring. The visible empty future is what ties the grid to the countdown.

Why it fits a phone where GitHub's doesn't: GitHub needs ~10px squares to separate five greens.
Two states at maximum contrast stay legible at 5px, so 53 columns is 318px — fits a 390px phone and
a 600px Kindle with no sideways scroll, then scales up on desktop. **The black-and-white rule is
what makes the full-year view possible on mobile.**

A table because that's what the data is — weeks × weekdays — and because it renders on anything
built since 1997. Right call on every device, not a Kindle compromise.

Mockup: [`mockups/gym-grid-year.html`](mockups/gym-grid-year.html) (chosen design, on its own,
per §6) and [`mockups/gym-grid-options.html`](mockups/gym-grid-options.html) (all four, for reference).

`/gym` also gets month blocks for the "which Tuesdays do I skip" question.

---

## 8. How a day works

```
  1. Open shaan.wiki/write  (home-screen icon on the phone, bookmark on the Kindle)
  2. Password
  3. Title  →  becomes the URL
  4. Write.  Phone: autosaves every keystroke.  Kindle: hit "Save draft" now and then
  5. [ ] Gym today?          ← one tap
  6. Publish
       ↓
  Function commits  entries/2026-07-31-title.md  +  updates  data/gym.json
       ↓
  Rebuild  →  live at  shaan.wiki/title  in under a minute
```

## 9. Entry format

```markdown
---
title: On buying a domain
date: 2026-07-30
day: 2
gym: true
tags: [domains, writing]
---

Body text. Wikilinks like [[On buying a domain]] resolve at build time.
```

Frontmatter is the only structure. Index, grid, backlinks, word counts and streaks are all
**derived** — delete the entire site and `entries/` rebuilds it. That's the durability guarantee,
and it's why the archive is text files and not a database.

## 10. URLs

```
/                      home
/<title-slug>          an entry
/<title-slug>.txt      raw source, plain text
/day/2                 the same entry by day number
/2026/07/30            the same entry by date
/archive               all 365 slots, filled and empty
/archive.txt           the whole year as one downloadable file
/gym                   full grid, month blocks, streak stats
/tag/<tag>             entries by tag
/wanted                wikilinks pointing at pages that don't exist yet
/random                jump somewhere
/colophon              how it's built
/write                 the editor
/feed.xml              RSS
/k/...                 Kindle mode — no CSS tricks, no JS, guaranteed
```

Title collisions get `-2`. Renaming leaves a redirect stub, because a wiki that breaks its own
links is a broken wiki.

## 11. Black and white

Three values: `#000`, `#fff`, and greys strictly for structure.

- **Hierarchy** → size, weight, letter-spacing. Nothing else.
- **Emphasis** → full black fill, white text. Used sparingly it hits harder than any colour.
- **Links** → underlined, offset tuned. Visited gets a subtler underline, not a different hue.
- **Rules** → 1px hairlines. Wikipedia's underlined headings, thinner, with more air.
- **Dark mode** → exact inversion. B&W is the one palette where flipping is lossless.
  Irrelevant on e-ink, and actively worse there, so the Kindle build stays light.
- **Images** → 1-bit dithered (Floyd–Steinberg). Tiny, instant, intentional-looking, and the only
  image format native to e-ink. **[OPEN Q6]**
- **Texture** → density is the only ornament: how tight the grid, how heavy the rule, how much air.

## 12. The countdown

```
   D A Y   0 0 3   ·   3 6 2   D A Y S   R E M A I N
```

Rendered into the HTML at build time so it's correct with JS off and on the Kindle. JS makes it
tick live where JS exists. Ticking seconds would ghost badly on e-ink, so the Kindle build is
days-only regardless. **[OPEN Q7]**

**What happens at zero?** Renew and start Year Two · freeze it as a permanent monument · let it
lapse and go dark. Doesn't need answering now, but the site should be *designed* as though the
ending matters, because that's what makes a countdown mean anything. **[OPEN Q9]**

## 13. Rules of the game

- **No backfilling.** **[LOCKED]** The write endpoint refuses any date but today.
- **Editing after posting:** allowed — it's a wiki, git keeps every version, each entry footers to
  its own revision history.
- **Deleting:** suggestion — no delete, only *retract*. The page stays, the body is struck through.
  Wikis don't memory-hole. **[OPEN]**
- **Minimum length:** one sentence counts. Zero words doesn't.
- **Day boundary:** needs a timezone, presumably IST, and a grace window — writing at 1am about the
  day that just ended is the normal case. Suggest the day ends at 4am local. **[OPEN Q3]**
- **Does the gym tick follow no-backfill?** Consistency says yes; it also means one forgetful tap
  costs a square you earned. **[OPEN Q8]**

## 14. Wiki features worth having

1. **Wikilinks + backlinks.** `[[Something]]` resolves at build time and adds a *"What links here"*
   section to the target. **This is what makes it a wiki and not a blog**, and it's ~30 lines.
2. **Wanted pages.** Every `[[link]]` to a page that doesn't exist yet gets listed at `/wanted` —
   a writing-prompt generator built from your own unfinished thoughts. Best idea in this document.
3. **Stub notice.** Under ~50 words renders *"This entry is a stub."*
4. **Revision history.** Every entry footer: "Last edited on X · all revisions" → GitHub.
5. **Talk pages.** `/talk/<entry>` — where you argue with your own past position.
6. **Citations.** Claims about your life footnoted to the commit or receipt that proves them.

## 15. Making it survive 365 days

The failure mode is not technical. It's **day 40, when you're tired.**

- Phone-first editor, one textarea, nothing in the way.
- Autosave every keystroke where JS exists; "Save draft" where it doesn't.
- One tap for the gym tick, no editor required.
- PWA icon on the home screen — a bookmark gets forgotten by day 12, an icon doesn't.
- **A nightly nudge** — a GitHub Action cron at 9pm if nothing's written. Unglamorous, and probably
  the highest-leverage feature in this document. **[OPEN Q4]**
- Never show a spinner. The entry appears saved instantly and syncs behind you.

## 16. Non-goals

No comments, likes, shares, analytics. No CMS or admin panel. No cookie banner, because there'll be
nothing to consent to. No colour, not even one accent. No JS required to read anything. No
dependencies, no CDN, no webfonts. No hero section, no CTA.

## 17. Budget

Home page under 20 KB including inlined CSS, one request to first paint. Entry page under 15 KB.
Archive under 60 KB. Usable on 3G, readable with JS off, legible on e-ink.
Footer flexes it: *"This page is 11.4 KB and made 1 request."*

---

## 18. Open questions **[OPEN]**

**Q1 — Which Kindle, and does HTTPS work on it?** Model and roughly what year. Now the single most
important unknown in the project: it decides whether the TLS-floor argument in §4 is decisive or
irrelevant. *Please try loading any https:// site on the Kindle and tell me what happens.*

**Q2 — Confirm Cloudflare Pages + Functions?** (§4, Option 1.) It means moving nameservers off
Spaceship. Say go and I'll write the setup steps.

**Q3 — Timezone and day boundary.** IST? Midnight, or ~4am so late-night writing counts for the
day it's about?

**Q4 — Where does Day 1 start?** Registration was 29 July, so under no-backfill **days 1 and 2 are
already permanent gaps before you've written a word.** Either (a) Day 1 is 29 July and you open
with two holes, or (b) Day 1 is your first entry and the countdown tracks the domain separately.
*Still the most time-sensitive question here — it needs answering before the first entry.*

**Q5 — Instant publish?** Should the Function also write a quick HTML page so the entry is live the
second you save, instead of ~40s later? (§4)

**Q6 — Images at all?** Dithered photos inside entries, or strictly text forever?

**Q7 — Countdown: days only, or ticking seconds** on devices that can handle it?

**Q8 — Does the gym tick follow the no-backfill rule?**

**Q9 — What happens on day 365?** Renew, freeze, or let it die.

**Q10 — What are you actually writing?** Freeform, or a fixed shape (a thought / a thing learned /
a log)? A paragraph or a page? Fixed shapes are far easier to sustain on a bad day, and this
changes the editor.

**Q11 — The nightly nudge** — email, push, or none?

---

## 19. Parking lot

- Email-to-entry via Cloudflare Email Workers — write from anywhere, no browser.
- Word-count bar chart across the year — a monochrome skyline of daily output.
- Footer stats: words written, days elapsed, longest streak, gym percentage.
- `curl shaan.wiki` returns a nicely formatted plain-text version. Because it should.
- `/api/shaan.json` — the whole archive as structured data.
- A "year in review" page auto-generated on day 365.
- Full-text search over the archive, `/` to focus.
- Print stylesheet — the year prints as a book at day 365.
- Send each entry to the Kindle by email so the archive lands in your library too.
