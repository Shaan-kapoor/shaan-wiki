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
Repo            github.com/Shaan-kapoor/shaan-wiki  (private for now, must go public)
```

GitHub rejects repo names ending in `.wiki`, hence `shaan-wiki`. Doesn't affect the domain.

## 3. Decisions **[LOCKED]**

| # | Decision | Consequence |
|---|---|---|
| 1 | Vanilla HTML/CSS/JS, no framework | No build tooling on Shaan's machine, ever |
| 2 | **Black and white only** | No accent colour, not even for links |
| 3 | Write from the site itself | After setup, no code editor is ever opened again |
| 4 | One password | Not OAuth, not accounts |
| 5 | Entries are plain text files | Git is the archive and the source of truth |
| 6 | `shaan.wiki/<title>` | Title determines the URL |
| 7 | Countdown to domain expiry | Real timestamp, on every page |
| 8 | Gym tracker, binary tick | **Gym only. No writing grid.** |
| 9 | **Public** — anyone can read | Repo goes public, GitHub Pages is free |
| 10 | **Browser commits straight to GitHub** | No server, no Worker, no infrastructure |
| 11 | **No backfilling.** A missed day stays missed | The grid is a record, not a to-do list |
| 12 | **Mobile-first** — most writing happens on a phone | The phone is the primary interface, not the desktop |
| 13 | **Must work on Kindle** | This is the hardest constraint in the project. See §6 |

---

## 4. Consequences of "browser commits straight to GitHub" + "public"

Two things follow that are worth understanding before we build.

### 4a. The "one password" can't literally be one password

With no server, there's nobody to check a password against. The thing that actually authorises a
write is a **GitHub token**, and on a public site that token can't be shipped in the code — the
code is public, so an encrypted token blob in the repo could be cracked offline at leisure.

So the honest version is:

```
First time on a device      paste the GitHub token once, choose a short passphrase
                            → token is encrypted with the passphrase (WebCrypto,
                              PBKDF2 + AES-GCM) and stored in localStorage
Every time after that       type the passphrase → start writing
Nothing is ever published   the token exists only on your phone and your laptop
```

Two devices, two one-time setups. After that it behaves exactly like the "just a password" you
wanted. **[OPEN Q4]** — confirm you're fine with the one-time token paste per device.

### 4b. The token expires, and that's a feature

GitHub fine-grained tokens max out at **366 days**. The domain expires in 365.
So: issue the token for the life of the domain, scoped to this one repo, `contents: write` only.
It dies when the project does. Nothing to rotate, nothing to remember.

Worst case if it leaks: someone can edit one repo of public writing, and git history undoes it.
That's the exposure, and it's acceptable — but it is real, and it's why the passphrase matters.

### 4c. Build runs in CI, never on your machine

The reader gets pure static HTML. A **GitHub Action** fires on every push to `entries/` and
regenerates the site — one page per entry, the index, the grid, the search index, the RSS.

The build step exists. It just runs on GitHub's machines. That's what makes "I never open a code
editor again" true while keeping the site JS-free to read.

**Publish latency:** ~30–60s from save to live. The write page renders the entry immediately, so
it never feels like waiting.

---

## 5. Mobile is the primary interface

Most entries get typed on a phone, in bed, at 11:40pm, tired. Every design decision defers to that.

- **The editor is one full-height textarea.** No toolbar, no formatting buttons, no preview toggle
  competing for space. Title field, body, gym tick, save. That's the entire UI.
- **Autosave to `localStorage` on every keystroke.** A dead battery must never cost an entry.
- **The keyboard must not cover the save button.** Save lives in the header, not the footer,
  and the layout uses `dvh` units so the viewport shrink is handled.
- **The gym tick is reachable without opening the editor** — one tap from the home screen.
- **Installable as a PWA** so it's an app icon, not a bookmark. This matters more than it sounds:
  a bookmark gets forgotten by day 12, an icon doesn't.
- **No hover-dependent anything.** Every hover affordance needs a tap equivalent.
- **Font size ≥ 16px in inputs**, or iOS zooms the page on focus and the whole thing feels broken.

---

## 6. Kindle compatibility — the constraint that shapes everything

This is the most restrictive target and it needs stating plainly, because it deletes a lot of the
clever ideas in this document.

The Kindle "Experimental Web Browser" is an old WebKit on e-ink. Depending on the model, expect:

| Thing | Status on Kindle |
|---|---|
| CSS Grid | **Unreliable to absent** |
| Flexbox | Partial, buggy, old syntax on older models |
| CSS custom properties (variables) | Risky on pre-2018 models |
| `:has()`, `popover`, anchor positioning, view transitions | **None of it** |
| `fetch()` | Likely missing — XHR only |
| Animation / transitions | Technically render, but e-ink ghosts. Effectively unusable |
| Hover | No pointer. Doesn't exist |
| Colour | 16 greys. **Black and white is already the right answer** |
| Web fonts | Skip them. System serif only |
| TLS | Older models fail on modern certs entirely **[OPEN Q1]** |

### What this forces

1. **Progressive enhancement stops being aspirational and becomes the architecture.**
   Base layer: HTML that reads correctly with no CSS at all. Then simple CSS everything supports.
   Then modern CSS as pure garnish, inside `@supports`. The `popover` hover-previews, the view
   transitions, the scroll-driven progress bar — all of it is garnish now. None of it can be load-bearing.
2. **The gym grid must be a `<table>`.** Not CSS Grid, not flexbox. A table of weeks × weekdays is
   what the data literally is, it's accessible, and it renders on anything built since 1997.
   *This turns out to be the right call on every device, not a compromise.*
3. **Layout in one column.** No sidebars, no infobox floated beside text. Kindle is 600px wide and
   so is a phone. One column, always. The v1 Wikipedia-infobox idea is dead — good riddance.
4. **Reading pages ship zero required JS.** Countdown is server-rendered into the HTML at build
   time; JS only makes it tick live where JS exists.
5. **A `/k` mode may be worth it** — same content, stripped stylesheet, no JS at all. Cheap to
   generate in the same build, and it guarantees the Kindle experience instead of hoping.

### Writing *from* the Kindle

Different question from reading, and much harder: the Kindle on-screen keyboard makes composing an
entry genuinely unpleasant, and `fetch` may not exist for the commit call (XHR fallback needed).

**Honest recommendation: Kindle is a reading device for this project, phone is the writing device.**
I'll make `/write` degrade far enough that it *works* on a Kindle in an emergency, but optimising
for it would cost more than it returns. **[OPEN Q2]** — agree, or do you actually want to compose there?

### The upside

Every Kindle constraint points the same direction as the things you already asked for: black and
white, no animation, tiny pages, text first, no dependencies. **The Kindle isn't fighting the
design — it's enforcing it.** If it looks good on e-ink, it's correct.

---

## 7. The gym grid

Gym only, per your call. So the design question is purely: what shape does a year of binary ticks take?

### How the references do it

**GitHub's contribution graph** — 53 columns (weeks) × 7 rows (weekdays), ~10–11px squares with
~3px gaps, month labels along the top, weekday labels on alternate rows, 5 intensity levels,
horizontal scroll on mobile.
Two things it gets right: weeks-as-columns makes **day-of-week patterns visible vertically** (you
can see at a glance that you never go on Sundays), and the whole year is one image.
One thing it gets wrong for us: it scrolls sideways on a phone, which is bad — and intensity levels
are wasted on binary data.

**Habit apps (Streaks, Habitica, and most of the genre)** — month-at-a-time calendar blocks.
More legible per-month, no scrolling, but you lose the year as a single object, and 12 blocks is
12 things to look at instead of one.

### The decision

**Full year, 53 × 7, weeks as columns — GitHub's shape — built as a `<table>`, sized to fit a phone
and a Kindle with no scrolling.**

The reason it fits where GitHub's doesn't: GitHub needs ~10px squares to distinguish five shades of
green. We have two states, black and white, the highest contrast that exists. **A 5px black square
on white is perfectly legible.** 53 columns at a 6px pitch is 318px — it fits a 390px phone and a
600px Kindle with room to spare, then scales up on desktop.

So the B&W constraint is what makes the full-year view possible on mobile at all. Nice when a
constraint pays for itself.

```
        Aug    Sep    Oct    Nov    Dec    Jan    Feb ...
   Mon  ■ ■ □ ■ ■ □ ■ ■ ■ □ ■ · · · · · · · · · · · ·
   Tue  ■ ■ ■ □ ■ ■ ■ □ ■ ■ ■ · · · · · · · · · · · ·
   Wed  □ ■ ■ ■ □ ■ ■ ■ □ ■ ■ · · · · · · · · · · · ·
   Thu  ■ □ ■ ■ ■ ■ □ ■ ■ ■ □ · · · · · · · · · · · ·
   Fri  ■ ■ □ ■ ■ □ ■ ■ ■ ■ □ · · · · · · · · · · · ·
   Sat  □ □ ■ ■ □ ■ □ ■ ■ ■ ■ · · · · · · · · · · · ·
   Sun  □ ■ □ ■ ■ ■ ■ □ □ ■ ■ · · · · · · · · · · · ·

   ■ went    □ didn't    · not yet
        147 of 213 days · current streak 6 · longest 19
```

Three states, three treatments: **solid black** (went), **1px outline** (didn't), **faint dot**
(hasn't happened). The future being visible — a year of empty squares waiting — is the whole
emotional point, and it's what ties the grid to the countdown.

Today's square gets a ring so you can always find it.

`/gym` gets the same data as month blocks for the "which Tuesdays do I skip" question, plus stats.
The homepage gets the year.

**A mockup of the real thing is in [`mockups/gym-grid.html`](mockups/gym-grid.html)** — open it on
your phone and your Kindle before we commit to it. **[OPEN Q3]**

---

## 8. How a day works

```
  1. Tap the shaan.wiki icon on the home screen
  2. Passphrase (once per session, or once per device if you prefer)
  3. Title  →  becomes the URL
  4. Write. Autosaves every keystroke.
  5. [ ] Gym today?          ← one tap
  6. Save
       ↓
  Browser commits  entries/2026-07-31-title.md  +  updates  data/gym.json
       ↓
  Action rebuilds  →  live at  shaan.wiki/title  in under a minute
```

## 9. Storage layout

```
entries/
  2026-07-29-first-entry.md
  2026-07-30-on-buying-a-domain.md
data/
  gym.json          { "2026-07-29": true, "2026-07-30": false, ... }
```

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

Frontmatter is the only structure. The index, the grid, backlinks, word counts and streaks are all
**derived** — delete the entire site and `entries/` rebuilds it. That's the durability guarantee,
and it's why the archive is text files rather than a database.

## 10. URLs

```
/                      home — countdown, gym grid, latest entry, recent list
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
/write                 the password-gated writing surface
/feed.xml              RSS
/k/...                 Kindle mode — same content, no CSS tricks, no JS
```

Title collisions get `-2`. Renaming leaves a redirect stub, because a wiki that breaks its own
links is a broken wiki.

## 11. Black and white — making monochrome look deliberate

Three values: `#000`, `#fff`, and greys used strictly for structure (hairlines, empty squares).

- **Hierarchy** → size, weight, letter-spacing. Nothing else.
- **Emphasis** → full black fill, white text. Used sparingly it hits harder than any colour.
- **Links** → underlined, offset tuned. Visited gets a subtler underline, not a different hue.
- **Rules** → 1px hairlines. Wikipedia's underlined headings, thinner, with more air.
- **Dark mode** → exact inversion. B&W is the one palette where flipping is lossless.
  (Though on Kindle it's irrelevant, and on e-ink dark mode is actively worse.)
- **Images** → 1-bit dithered (Floyd–Steinberg). Tiny, instant, and looks intentional in a way a
  greyscale photo never does. Also the only image format that's *native* to e-ink. **[OPEN Q7]**
- **Texture** → density is the only ornament available: how tight the grid, how heavy the rule,
  how much air. Monochrome forces us to be good at this.

The stylesheet should fit on one screen and inline into `<head>`.

## 12. The countdown

```
   D A Y   0 0 3   ·   3 6 2   D A Y S   R E M A I N
   ────────────────────────────────────────────────
```

Rendered into the HTML at build time so it's correct with JS off and on Kindle. JS makes it tick
live where JS exists.

Days-only (calm, monumental) or ticking seconds (urgent, a performance)? Seconds would ghost
horribly on e-ink, so at minimum the Kindle build is days-only. **[OPEN Q6]**

**What happens at zero?** Renew and start Year Two · freeze it as a permanent monument · let it
lapse and go dark. Doesn't need answering now, but the site should be *designed* as though the
ending matters, because that's what makes a countdown mean anything. **[OPEN Q10]**

## 13. Rules of the game

- **No backfilling.** **[LOCKED]** A gap is permanent. The write endpoint refuses any date but today.
- **Editing an entry after posting:** allowed — it's a wiki, and git keeps every version. Each entry
  footers to its own revision history.
- **Deleting:** suggestion — no delete, only *retract*. The page stays, the body is struck through.
  Wikis don't memory-hole. **[OPEN]**
- **Minimum length:** one sentence counts. Zero words doesn't.
- **Day boundary:** needs a timezone, presumably IST — and a grace window, because writing at 1am
  about the day that just ended is the normal case, not the exception. Suggest the day ends at 4am
  local. **[OPEN Q5]**
- **Does the gym tick follow the same no-backfill rule?** If you forget to tick on Tuesday, is
  Tuesday gone? Consistency says yes; it also means one forgetful tap costs you a square you earned.
  **[OPEN Q8]**

## 14. Wiki features worth having

1. **Wikilinks + backlinks.** Write `[[Something]]`; the build resolves it and adds a
   *"What links here"* section to the target. **This is what makes it a wiki and not a blog**,
   and it's ~30 lines in the build script.
2. **Wanted pages.** Every `[[link]]` to a page that doesn't exist yet gets listed at `/wanted` —
   a writing-prompt generator built out of your own unfinished thoughts. Best idea in this document.
3. **Stub notice.** Under ~50 words renders *"This entry is a stub."* Honest, and the same joke
   Wikipedia has been making for 25 years.
4. **Revision history.** Footer of every entry: "Last edited on X · all revisions" → GitHub.
5. **Talk pages.** `/talk/<entry>` — where you argue with your own past position.
6. **Citations.** Claims about your own life footnoted to the commit, tweet, or receipt that proves
   them. Turns autobiography into something falsifiable.

## 15. Making it survive 365 days

The failure mode is not technical. It's **day 40, when you're tired.**

- Phone-first editor, one textarea, nothing in the way.
- Autosave every keystroke. Non-negotiable.
- One tap for the gym tick, no editor required.
- PWA icon on the home screen.
- **A nightly nudge** — a GitHub Action cron that pings you at 9pm if nothing's written yet.
  Unglamorous, and probably the highest-leverage feature in this document. **[OPEN Q9]**
- Never show a spinner. The entry appears saved instantly and syncs behind you.

## 16. Non-goals

- No comments, likes, share buttons, or analytics.
- No CMS, no admin panel, no database of record.
- No cookie banner, because there'll be nothing to consent to.
- No colour. Not even one accent. Not even for links.
- No JS required to read anything.
- No dependencies, no CDN, no webfonts.
- No hero section, no scroll-jacking, no CTA.

## 17. Budget

- Home page **under 20 KB** including inlined CSS, one request to first paint.
- Entry page under 15 KB. Archive page under 60 KB.
- Usable on 3G, readable with JS off, legible on e-ink.
- Footer flexes it: *"This page is 11.4 KB and made 1 request."*

---

## 18. Open questions **[OPEN]**

**Q1 — Which Kindle?** Model and roughly what year. A 2023 Scribe and a 2014 Paperwhite are
completely different browsers, and it decides how much of the modern CSS survives. If it's an older
one, TLS may fail before we even get to layout — worth you trying to load any HTTPS site on it now
and telling me what happens. *This is the highest-value thing you can check today.*

**Q2 — Kindle: read-only, or write there too?** My recommendation is read-only, with `/write`
degrading enough to work in a pinch. (§6)

**Q3 — The grid.** Mockup is in `mockups/gym-grid.html`. Open it on the phone and the Kindle.
Does the full-year view hold up, or do you want month blocks?

**Q4 — The one-time token paste per device.** Fine? (§4a) If it bothers you, the Cloudflare Worker
route gives you a true password-only login — it's ~40 lines and free, and it's the one thing I'd
still nudge you toward.

**Q5 — Timezone and day boundary.** IST? And does the day end at midnight or ~4am?

**Q6 — Where does Day 1 start?** Registration day was 29 July — which means under a no-backfill
rule, **days 1 and 2 are already permanent gaps before you've written a word.** Options: (a) Day 1
is 29 July and you start with two holes, which is either honest or demoralising; (b) Day 1 is your
first entry and the countdown just tracks the domain separately. *This needs answering before the
first entry, so it's the most time-sensitive question here.*

**Q7 — Images at all?** Dithered photos inside entries, or strictly text forever?

**Q8 — Does the gym tick follow the no-backfill rule?** (§13)

**Q9 — The 9pm nudge?** Email, push, or none.

**Q10 — What happens on day 365?** Renew, freeze, or let it die. (§12)

**Q11 — What are you actually writing?** Freeform, or a fixed shape (a thought / a thing learned /
a log)? And rough length — a paragraph or a page? Fixed shapes are far easier to sustain on a bad
day. This determines whether the archive reads as notes or as essays, and it changes the editor.

---

## 19. Parking lot

- Word-count bar chart across the year — a monochrome skyline of how much you wrote each day.
- Footer stats: words written, days elapsed, longest streak, gym percentage.
- `curl shaan.wiki` returns a nicely formatted plain-text version. Because it should.
- `/api/shaan.json` — the whole archive as structured data.
- A "year in review" page auto-generated on day 365.
- Full-text search over the archive, `/` to focus, from a generated index.
- Print stylesheet — the year prints as a book. Genuinely worth doing at day 365.
- Send each entry to the Kindle by email as it's written, so the archive lands in your library too.
