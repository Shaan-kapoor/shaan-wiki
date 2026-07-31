# idea.md, shaan.wiki

Living ideation doc. **[LOCKED]** = decided. **[OPEN]** = needs Shaan.

Last updated: 2026-07-31

---

## 1. The pitch

**shaan.wiki is a one-year writing machine with a death clock on it.**

From 31 July 2026 to 30 July 2027, Shaan writes one thing a day and ticks whether he went to the
gym. Each day's entry seals at midnight and becomes a permanent page. At the end the site is the
archive of a year, 365 articles, 365 squares, and a number that counted down the whole time.

The constraint isn't decoration. **The domain expires before the year is over.** See §3.

## 2. Ground truth

```
Domain          shaan.wiki
Registrar       Spaceship, Inc.
Registered      2026-07-29 19:48:39 UTC
Expires         2027-07-29 19:48:39 UTC  =  2027-07-30 01:18:39 IST
Nameservers     launch1/launch2.spaceship.net  (parked, nothing served yet)
Repo            github.com/Shaan-kapoor/shaan-wiki  (private for now)

Day 1           2026-07-31  (Friday)
Day 365         2027-07-30  (Friday)
Timezone        Asia/Kolkata, UTC+5:30, no DST, ever
Day boundary    00:00:00 IST to 23:59:59 IST
Kindle          newest model, modern browser, no compatibility worries
```

## 3. Two hard facts about the calendar

**Fact one: Day 1 is tomorrow.** Today is 31 July. There is one day to get a working write path
live, or Day 1 goes unrecorded under a no-backfill rule. See §10 for what that means in practice, the good news is that the architecture makes a tiny Day-1 version genuinely viable.

**Fact two: the domain dies on Day 364.**

```
   Day 363   2027-07-29    ████
   Day 364   2027-07-30    ███░   ← 01:18 IST, the domain expires
   Day 365   2027-07-31    ░░░░   ← this day exists only if you renew
```

The writing year is 365 days from 1 August. The domain runs out roughly 34 hours before that year
is finished. **You cannot complete the project without renewing.**

That's not a bug to fix, it's the best thing that's happened to this idea. The countdown isn't
decorative any more; on Day 364 it forces an actual decision, with 364 days of work sitting behind
it. Three ways to handle it:

- **(a) Two numbers, both true.** "Day 12 of 365" and "352 days until the domain expires" run side
  by side, offset by a day and a half. Honest, and the gap becomes visible as the year closes.
- **(b) Countdown targets Day 365** (2027-07-31), not the registry date. Cleaner, slightly less real.
- **(c) Renew early**, and the countdown resets to a new expiry. Kills the tension.

*Recommendation: (a).* **[OPEN Q1]**

## 4. Decisions **[LOCKED]**

| # | Decision | Consequence |
|---|---|---|
| 1 | Vanilla HTML/CSS/JS, no framework | No build tooling on Shaan's machine, ever |
| 2 | Black and white only | No accent colour, not even for links |
| 3 | Write from the site itself | After setup, no code editor is ever opened again |
| 4 | **One password, unchanging** | Same password, every device, forever. No tokens, no rotation |
| 5 | Entries are plain text files | Git is the archive and the source of truth |
| 6 | `shaan.wiki/<title>` | Title determines the URL |
| 7 | Countdown to expiry | Real timestamp, on every page |
| 8 | Gym tracker, binary tick | Gym only. No writing grid |
| 9 | Public, anyone can read | Repo goes public |
| 10 | No backfilling | A missed day stays missed |
| 11 | Mobile-first | The phone is the primary writing device |
| 12 | Grid = full year, 53×7, `<table>` | GitHub's shape. See §8 |
| 13 | Read **and** write on Kindle | Newest model, so no browser archaeology. See §6 |
| 14 | One HTML file per thing | Components and pages are separate source files. See §7 |
| 15 | **Day = 00:00–00:00 IST** | No grace window. Midnight is midnight |
| 16 | **Entries seal at midnight IST** | Editable all day, immutable forever after. See §5 |
| 17 | **Day 1 = 31 July 2026** | Day 365 = 30 July 2027, the day the domain expires |

---

## 5. The day model

This is the heart of the thing, so it's worth being exact.

```
  00:00 IST ──────────────── the day opens
            create today's entry
            edit it as many times as you like
            change the title, rewrite it, tick and untick the gym
  00:00 IST ──────────────── the day closes, and the entry is sealed
            it can never be edited again
            if nothing was written, that square stays empty forever
```

**Sealing needs no scheduled job.** The rule is simply that the write endpoint only accepts today's
date, computed server-side in `Asia/Kolkata`. At midnight, yesterday stops being today and every
write to it is refused. Nothing to run, nothing to break, nothing to forget.

IST is UTC+5:30 with no daylight saving, so the arithmetic is a fixed offset, no timezone library,
no edge cases twice a year.

**The consequence worth naming:** a typo spotted on Wednesday about Tuesday's entry is permanent.
That's the price of the entries meaning something, and it's the right trade, but there's a
wiki-native escape hatch if you want it:

> **Addenda.** You can't edit a sealed entry, but you could append a dated note to it, > rendered as a separate block below the text, clearly marked as written later.
> The original stays untouched, corrections stay possible, and the archive stays honest.
> This is exactly what a wiki talk page is for. **[OPEN Q2]**

**One entry per day.** One file per day enforces it structurally, and it matches one square per
day. If you'd ever want two on the same day, say so now, because it changes the file layout. **[OPEN Q3]**

**The gym tick follows the same rule**, tick and untick freely all day, sealed at midnight.
Forget to tap before bed and the day counts as a miss. Consistent with everything else. **[OPEN Q4]**

---

## 6. Kindle, the constraint just got much smaller

Newest model, so: modern WebKit, CSS Grid, flexbox, custom properties, `fetch`, modern TLS.
All the browser archaeology in the previous draft is deleted.

**What remains is physics, not compatibility:**

| Still true on e-ink | Why |
|---|---|
| No animation, no transitions | Ghosting and slow repaint. Motion looks broken on e-paper |
| No hover | There's no pointer |
| Greyscale | Already the plan |
| Slow full-page repaints | Keep pages small; avoid layout that reflows on scroll |
| Page-turn reading, not scroll | Long single-column text is ideal; sticky UI is not |

So: **the target moved from "a browser from 2012" to "a modern browser on slow paper."**
Much more pleasant. Modern CSS is back on the menu; animation and hover stay off, because of the
display, not the engine.

**What I'm keeping anyway:** the write form stays a plain `<form method="post">` that works with JS
disabled. Not out of necessity now, but because it's fewer moving parts, it can't half-fail, and on
e-ink a full page load is honestly a better interaction than a JS editor trying to be clever.
Autosave and word count layer on top where JS is running.

---

## 7. The write path **[LOCKED]**

"The password should remain the same" settles this. A single unchanging password, working on every
device with nothing to paste and nothing to expire, can only be checked **server-side**, so the
browser-commits-directly-to-GitHub option is out for good. That approach needed a per-device token
that expires in 366 days, which is the opposite of what you asked for.

### Cloudflare Pages + Pages Functions

```
/write            plain <form method="post" action="/api/write">
   ↓ POST         password · title · body · [ ] gym
/api/write        a Pages Function, ~60 lines
                    · resolves "today" in Asia/Kolkata
                    · checks the password, constant-time, rate-limited
                    · refuses any date that isn't today  ← the seal
                    · commits entries/2026-07-31.md via the GitHub API
                    · 302 → back to /write with the entry loaded
   ↓ push
GitHub            the archive. Push triggers a Cloudflare Pages build
   ↓ ~40s
shaan.wiki/title  live
```

- One password, server-side, same everywhere, never expires.
- Works with JavaScript disabled.
- Free, 100k function calls a day; this needs about two.
- One `git push` deploys everything. One dashboard.
- GitHub Actions still earns a place: the 9pm nudge cron. It's a builder and a scheduler,
  never a receiver, there's no way to POST to a repo from an anonymous form.

The TLS argument from the last round is now moot, since the Kindle is modern. Cloudflare still wins
on having the function and the hosting in one place.

**Setup, once:** a Cloudflare account, point `shaan.wiki`'s nameservers there from Spaceship, connect
the GitHub repo, set two secrets (`SITE_PASSWORD`, `GITHUB_TOKEN`). Then never again. **[OPEN Q5]**

---

## 8. The gym grid **[LOCKED]**

Full year, 53 columns × 7 rows, weeks as columns, GitHub's shape, built as a `<table>`.

Three states: solid black (went), 1px outline (didn't), faint outline (hasn't happened yet).
Today's square gets a ring. The visible empty future is what ties the grid to the countdown.

Why it fits a phone where GitHub's doesn't: GitHub needs ~10px squares to separate five greens. Two
states at maximum contrast stay legible at 5px, so 53 columns is 318px, fits a 390px phone and a
Kindle with no sideways scroll, then scales up on desktop. **The black-and-white rule is what makes
the full-year view possible on mobile.**

A table because that's what the data is, weeks × weekdays, and it needs no CSS Grid to hold shape.

Mockups: [`gym-grid-year.html`](mockups/gym-grid-year.html) (chosen) ·
[`gym-grid-options.html`](mockups/gym-grid-options.html) (all four, for reference).

---

## 9. File structure **[LOCKED]**

One file per thing. The build assembles them; HTML has no native include, which is precisely what
the build step is for.

```
src/
  pages/
    index.html          home, countdown, grid, latest entry
    entry.html          template for a single entry
    archive.html        all 365 slots
    gym.html            full grid + month blocks + stats
    write.html          the editor
    colophon.html       how it's built
    404.html
  components/
    head.html           meta, inlined critical CSS
    masthead.html       the countdown
    gym-grid-year.html  the 53×7 grid, its own file
    gym-grid-month.html month blocks, its own file
    gym-stats.html      streaks and percentages
    entry-list.html
    footer.html
  css/
    base.css
    print.css
  js/
    countdown.js        enhancement only
    editor.js           autosave, word count, enhancement only

entries/
  2026-07-31.md         one file per day. Title lives in frontmatter
data/
  gym.json              { "2026-07-31": true, ... }

functions/
  api/write.js          the Cloudflare Pages Function

build/
  build.py              ~150 lines, no dependencies

mockups/                throwaway explorations, one file per idea
public/                 build output, what gets served
```

Templating stays deliberately stupid: `{{> components/gym-grid-year.html }}` to include,
`{{ title }}` for a value. No template language, no dependencies, no npm.

**Source is many files; output is few.** The build inlines critical CSS so a reader still gets one
request. Splitting the source is for us, the reader gets the monolith.

### Entry format

```markdown
---
title: On buying a domain
date: 2026-07-31
day: 1
gym: true
tags: [domains, writing]
---

Body text. Wikilinks like [[On buying a domain]] resolve at build time.
```

**Filename is the date, not the title.** That means changing your mind about the title mid-day is
just a frontmatter edit, not a file rename, and one file per date structurally enforces one entry
per day. The URL is derived from the title at build time.

Everything else, index, grid, backlinks, word counts, streaks, is **derived**. Delete the whole
site and `entries/` rebuilds it. That's why the archive is text files and not a database.

---

## 10. Day 1 is tomorrow

Under a no-backfill rule, this is a real deadline, and it deserves a plan rather than optimism.

**What must exist by tomorrow:** the ability to save an entry with the right date. That's all.
The grid, the archive, the styling, the wikilinks, none of it has to exist, because entries are
plain text files and every view is derived from them. **Anything not built tomorrow can be built on
day 30 and will retroactively render every entry written before it.**

So the minimum viable Day 1 is:

```
1. Cloudflare account + nameservers moved            you, ~15 min
2. Repo public, Pages connected                      me, ~5 min
3. /write, a plain form, password, saves a file     me, ~1 hour
4. A stub home page so the domain resolves           me, ~15 min
```

Everything in this document beyond that is week two onwards.

**Insurance if we don't make it:** Day 1's entry gets written into the repo by hand and the system
picks it up. The no-backfill rule protects future-you from cheating; it shouldn't punish past-you
for the tooling not existing yet. Worth agreeing now so it isn't a debate tomorrow night. **[OPEN Q6]**

---

## 11. URLs

```
/                      home
/<title-slug>          an entry
/<title-slug>.txt      raw source, plain text
/day/2                 the same entry by day number
/2026/08/01            the same entry by date
/archive               all 365 slots, filled and empty
/archive.txt           the whole year as one downloadable file
/gym                   full grid, month blocks, streak stats
/tag/<tag>             entries by tag
/wanted                wikilinks pointing at pages that don't exist yet
/random                jump somewhere
/colophon              how it's built
/write                 the editor
/feed.xml              RSS
```

Title collisions get `-2`. Renaming leaves a redirect stub, but note that sealing means titles
can only change on the day itself, so this barely ever fires.

## 12. Black and white

Three values: `#000`, `#fff`, and greys strictly for structure.

- **Hierarchy** → size, weight, letter-spacing. Nothing else.
- **Emphasis** → full black fill, white text. Sparingly, it hits harder than any colour.
- **Links** → underlined, offset tuned. Visited gets a subtler underline, not a different hue.
- **Rules** → 1px hairlines. Wikipedia's underlined headings, thinner, with more air.
- **Dark mode** → exact inversion. B&W is the one palette where flipping is lossless.
  Skipped on e-ink, where it's actively worse.
- **Images** → 1-bit dithered (Floyd–Steinberg). Tiny, instant, and the only image format native
  to e-ink. **[OPEN Q7]**
- **Texture** → density is the only ornament: how tight the grid, how heavy the rule, how much air.

## 13. The countdown

```
   D A Y   0 0 1   ·   3 6 4   D A Y S   R E M A I N
```

Rendered into the HTML at build time so it's correct with JS off. JS makes it tick live where JS
runs, but never on the Kindle build, where a ticking clock would ghost the screen. **[OPEN Q8]**

**What happens at zero** is now a real question rather than a philosophical one, because zero
arrives before the year does. See §3.

## 14. Rules of the game

- **No backfilling.** The endpoint refuses any date but today.
- **Editing:** all day, then never. §5.
- **Deleting:** suggestion, no delete, only *retract*. The page stays, the body is struck through.
  Wikis don't memory-hole. **[OPEN]**
- **Minimum length:** one sentence counts. Zero words doesn't.

## 15. Wiki features worth having

1. **Wikilinks + backlinks.** `[[Something]]` resolves at build time and adds a *"What links here"*
   section to the target. **This is what makes it a wiki and not a blog**, and it's ~30 lines.
2. **Wanted pages.** Every `[[link]]` to a page that doesn't exist yet gets listed at `/wanted`, a writing-prompt generator built from your own unfinished thoughts. Best idea in this document.
3. **Stub notice.** Under ~50 words renders *"This entry is a stub."*
4. **Revision history.** Every entry footer links to its own git history.
5. **Citations.** Claims about your life footnoted to the commit or receipt that proves them.

## 16. Making it survive 365 days

The failure mode is not technical. It's **day 40, when you're tired.**

- Phone-first editor: one textarea, nothing in the way.
- Autosave every keystroke where JS runs.
- One tap for the gym tick, no editor required.
- PWA icon on the home screen, a bookmark gets forgotten by day 12, an icon doesn't.
- **A nightly nudge**, a GitHub Action cron at ~9pm IST if nothing's written. Unglamorous, and
  probably the highest-leverage feature in this document. Sealing at midnight makes it matter more.
  **[OPEN Q9]**
- Never show a spinner.

## 17. Non-goals

No comments, likes, shares, analytics. No CMS or admin panel. No cookie banner, because there'll be
nothing to consent to. No colour, not even one accent. No JS required to read anything.
No dependencies, no CDN, no webfonts. No hero section, no CTA.

## 18. Budget

Home page under 20 KB including inlined CSS, one request to first paint. Entry page under 15 KB.
Archive under 60 KB. Usable on 3G, readable with JS off, legible on e-ink.
Footer flexes it: *"This page is 11.4 KB and made 1 request."*

---

## 19. Open questions **[OPEN]**

**Q5 and Q6 are the only two that block tomorrow. The rest can wait.**

**Q5, Cloudflare: do you have an account, and are you OK moving nameservers off Spaceship?**
Blocking. Nothing ships without it.

**Q6, Day 1 insurance.** If the write path isn't live by tomorrow night, do we hand-commit Day 1's
entry? Blocking, in the sense that it needs deciding before tomorrow night, not after.

**Q1, Countdown target:** two numbers side by side, or point it at Day 365? (§3)

**Q2, Addenda on sealed entries?** Append-only dated notes, or is sealed truly sealed? (§5)

**Q3, One entry per day, or can there be two?** Changes the file layout. (§5)

**Q4, Gym tick seals at midnight too?** Forget to tap and the day is a miss. (§5)

**Q7, Images at all?** Dithered photos inside entries, or strictly text forever?

**Q8, Countdown: days only, or ticking seconds** where the display can take it?

**Q9, The nightly nudge**, email, push, or none?

**Q10, What are you actually writing?** Freeform, or a fixed shape (a thought / a thing learned /
a log)? A paragraph or a page? Fixed shapes are far easier to sustain on a bad day, and this
changes the editor. Not blocking, but it's the difference between an archive of notes and an
archive of essays.

---

## 20. Parking lot

- Email-to-entry via Cloudflare Email Workers, write from anywhere, no browser.
- Word-count bar chart across the year, a monochrome skyline of daily output.
- Footer stats: words written, days elapsed, longest streak, gym percentage.
- `curl shaan.wiki` returns a nicely formatted plain-text version. Because it should.
- `/api/shaan.json`, the whole archive as structured data.
- A "year in review" page auto-generated on day 365.
- Full-text search over the archive, `/` to focus.
- Print stylesheet, the year prints as a book at day 365.
- Send each entry to the Kindle by email so the archive lands in your library too.

---

## 21. Running it

```
python3 build/build.py          # writes public/
SHAAN_TODAY=2027-02-27 \
SHAAN_ENTRIES=... SHAAN_GYM=... \
SHAAN_OUT=... python3 build/build.py    # a populated preview, real archive untouched
```

Python 3.8+, no dependencies. CI runs the same command on every push and deploys `public/`
to GitHub Pages.

Live setup, all one-time and all done: DNS is four A records on the apex pointing at GitHub
Pages, the custom domain is claimed by `data/domain.txt` becoming the `CNAME` file in the
build, and `data/vault.json` holds the write token encrypted with the password. Rotating the
password or the token means visiting `/setup` again and nothing else.
