# idea.md — shaan.wiki

Living ideation doc. Nothing here is final. Sections marked **[OPEN]** need Shaan's input.

Last updated: 2026-07-31

---

## 1. The one-line pitch

`shaan.wiki` — a personal site that reads like an encyclopedia entry about a person,
built as plain HTML/CSS/JS, loading in the blink of an eye.

## 2. What Shaan has said so far

Direct capture of requirements, unedited in spirit:

- It's **me, Shaan**. The site is about me / mine.
- A **website or a page** — currently ambiguous whether it's one page or many. See [OPEN Q1].
- **Very, very lightweight. Very, very fast-loading.**
- **Vanilla stack**: HTML, CSS, JS. "A basic one." No framework, no build step implied.
- **Look and feel**: Wikipedia-like — or actually *more* minimal than Wikipedia.
  Wikipedia is the reference point for *structure and tone*, not necessarily for chrome.
- **Explore the medium**: figure out what vanilla HTML/CSS can actually pull off here.
  The page should *act as something*, not just sit there. This is the interesting part.

## 3. Principles (proposed — challenge these)

1. **No build step.** You can open `index.html` from the filesystem and it works.
2. **No dependencies.** Zero npm, zero CDN, zero webfont fetch. System font stack.
3. **Budget: under 50 KB** for the first page, uncompressed, including CSS. Ideally under 20 KB.
   No image required to understand the page.
4. **Works with JS off.** JS is an enhancement layer only, never a requirement for content.
5. **Text first.** If a feature can't be expressed in a paragraph or a table, question it.
6. **One request ideal.** CSS inlined in `<head>`, so the page renders on the first round trip.
7. **Ages well.** No trend styling. It should look deliberate in 2036.

## 4. The "Wikipedia but minimal" question

Wikipedia's visual language is made of a few separable parts. We can take some, drop others:

| Element | Take it? | Note |
|---|---|---|
| Serif headings, sans body | Probably | The single most "encyclopedia" signal |
| Horizontal rule under H1/H2 | Yes | Cheap, instantly recognisable |
| **Infobox** (right-hand fact card) | Yes — signature piece | The most fun element to build |
| Table of contents block | Yes | Auto-generated from headings via ~15 lines of JS |
| Blue links, purple visited | Maybe | Feels dated; alternative below |
| Hover-preview popups on links | **Yes — this is the killer feature** | Pure CSS or ~20 lines JS |
| `[edit]` links per section | As a joke/real feature | Could open a GitHub edit link |
| "From Wikipedia, the free encyclopedia" subtitle | Parody line | e.g. "From shaan.wiki, a person" |
| Citations / footnotes with backlinks | Yes | Great for making claims about yourself accountable |
| Sidebar nav, logo, tabs, dense UI chrome | **No** | This is the part we strip |
| Wikipedia's actual colors/logo | No | Don't imitate the brand, borrow the form |

**The thesis:** keep Wikipedia's *epistemics* (structure, citation, neutrality, hyperlink density),
drop Wikipedia's *interface*.

## 5. "What can vanilla HTML/CSS actually do here?" — the exploration list

This is the section to grow. Things that feel like JS but aren't:

**Genuinely zero-JS tricks**
- `<details>`/`<summary>` — collapsible sections, spoilers, "read more", FAQ.
- `:target` — click a link, a hidden panel appears. Enables tabs, modals, routing-without-router.
- `popover` attribute + `anchor-name` / `position-area` — native tooltips and hover cards,
  anchored to their trigger. This gets us Wikipedia link-previews with **no JS at all**.
- `scroll-driven animations` (`animation-timeline: view()`) — a reading progress bar, elements
  that fade in on scroll, all off the main thread.
- `:has()` — real conditional styling. E.g. the layout reflows if an infobox is present.
- `field-sizing`, `text-wrap: balance/pretty` — typography that behaves without measurement JS.
- `@media (prefers-color-scheme)` + `light-dark()` — dark mode in about four lines.
- `content-visibility: auto` — long page stays fast, browser skips offscreen work.
- CSS counters — auto-numbered sections and footnotes, exactly like a real encyclopedia.
- `<dialog>` — real modals, one attribute of JS to open.
- View Transitions (`@view-transition`) — cross-page morph animations on a multi-page static site.
  A multipage site that feels like an SPA, with zero router.
- `<input type=search>` + `:has()` + sibling selectors — a filter UI with no JS for small lists.
- Print stylesheet — the page prints as a clean document. Very on-brand for a wiki.

**Where JS earns its place (small, hand-written, no libraries)**
- Auto-generating the table of contents from `<h2>`/`<h3>`.
- Client-side search across pages (a small prebuilt JSON index, or just `fetch` + filter).
- Keyboard shortcuts — `/` to search, `g h` to go home. Very wiki-power-user.
- The "random page" button.
- A tiny "last edited" line pulled from the git commit date at build/publish time.

## 6. Content architecture — proposed

The conceit: Shaan is the subject of an encyclopedia. Every entity in his life gets a page.

```
/                     → the main article. "Shaan Kapoor" — the person.
/now                  → what I'm doing currently (nownownow.com convention)
/writing              → index of posts, each post is its own "article"
/projects/<slug>      → one article per project, with its own infobox
/people                → (optional, careful) people I've worked with, linked from the main article
/colophon             → how this site is built. The nerd-bait page.
/changelog            → the "revision history". Literally the git log, rendered.
```

The **revision history** idea is strong: a real wiki's most distinctive feature is that it
admits it changes over time. A page showing every edit to this site, generated from git,
would be both honest and structurally novel for a personal site.

## 7. The infobox — the signature element

Right-aligned fact card on the main article:

```
┌─────────────────────────┐
│      Shaan Kapoor       │
│   [ optional photo ]    │
├─────────────────────────┤
│ Born        │ ...       │
│ Based in    │ ...       │
│ Occupation  │ ...       │
│ Known for   │ ...       │
│ Years active│ ...       │
│ Website     │ shaan.wiki│
└─────────────────────────┘
```

On mobile it becomes a full-width card above the intro paragraph. Pure CSS, one media query.
Content for this is [OPEN Q4].

## 8. Ideas that go further (pick the ones you like, kill the rest)

1. **Hover previews on internal links.** Hover "Project X" in a sentence, get a card with its
   one-line summary and infobox thumbnail. Native `popover` + anchor positioning. Zero JS.
   *This is the single feature that will make people say "how did you do that."*
2. **Citations for your own life.** `Shaan built X in 2024.[1]` where `[1]` links to the actual
   commit, tweet, or launch post. Turns a résumé into something falsifiable. Very funny, very rigorous.
3. **`[edit]` links that actually work.** Each section's `[edit]` deep-links to that line in the
   GitHub file. The site is genuinely editable — by you, and via PR, by anyone.
4. **The stub page.** Pages that don't exist yet render as "This article is a stub. You can help
   by expanding it." Makes incompleteness a feature instead of an embarrassment.
5. **Talk pages.** A `/talk/<page>` for each article — where you argue with yourself about a
   position you hold. The most intellectually honest thing a personal site can have.
6. **Revision history from git.** See §6.
7. **Disambiguation page.** `shaan.wiki/shaan` → "Shaan may refer to: ..." Cheap joke, great payoff.
8. **A "This article needs additional citations" banner** you can toggle on genuinely uncertain claims.
9. **Wikilink syntax in source.** Write `[[Project X]]` in your markdown/HTML and a 10-line script
   resolves it to a real link + preview. Makes writing new pages frictionless.
10. **Whole-site keyboard nav + instant search** (`/` key). Feels like a tool, not a homepage.
11. **View Transitions between articles** so a multi-page static site navigates like an app,
    while still being just files on disk.
12. **Weight badge in the footer.** "This page is 11.4 KB and made 1 request." Flexing the constraint.

## 9. Open questions for Shaan **[OPEN]**

**Q1 — Scope.** One long single page, or a genuine multi-page mini-wiki with internal links?
The multi-page version is where the "wiki" idea pays off; single page is faster to ship.
*Suggestion: build the main article first, structured so pages can be added without rework.*

**Q2 — Purpose.** Who lands here and what should happen? Options aren't exclusive:
(a) a résumé/credibility page for recruiters and investors,
(b) a personal identity/link hub,
(c) a genuine writing home,
(d) a portfolio for specific projects,
(e) an art piece / experiment where the *form* is the point.
The answer changes the content hierarchy a lot.

**Q3 — Tone.** Straight-faced encyclopedia (fully committed to the bit, third person,
"Shaan is an Indian engineer known for...") or self-aware and playful?
*The straight-faced version is funnier and more elegant, but it takes nerve.*

**Q4 — Facts.** For the infobox and lead paragraph: what do you actually do, where are you,
what are you known for, what are you working on right now? Give me raw notes, I'll shape them.

**Q5 — Hosting.** GitHub Pages, Cloudflare Pages, Netlify, or your own? Is the domain
`shaan.wiki` already registered?

**Q6 — Content authoring.** Do you want to write raw HTML, or write Markdown and have a tiny
script generate HTML? The second breaks the "no build step" purity but makes you write more.
*Suggestion: raw HTML at first — with good templates it's genuinely fine — and add a generator
only when the page count makes it hurt.*

**Q7 — Visual identity.** Any color at all, or strictly black/white/grey? One accent colour,
used sparingly, tends to be what separates "minimal" from "unstyled".

**Q8 — Photo.** Is there a picture of you in the infobox, or is this deliberately faceless?

**Q9 — Dark mode.** Auto-follow the system, a manual toggle, or not at all?

**Q10 — Analytics.** Any? A privacy-respecting counter, or genuinely nothing?

## 10. Non-goals (proposed)

- No CMS, no admin panel, no database.
- No cookie banner, because there will be nothing to consent to.
- No hero section, no scroll-jacking, no "let's build something great together" CTA.
- Not a Notion page, not a Linktree, not a Webflow site. The point is that it's hand-made.

## 11. Parking lot

Ideas mentioned but not yet placed. Add freely.

- RSS feed for the writing section (a static XML file, hand-updated or scripted).
- An OpenGraph image generated once per page, or skipped entirely.
- `/api/shaan.json` — the whole site as structured data, because a wiki should be machine-readable.
- Schema.org `Person` JSON-LD, so Google renders a knowledge panel. Fitting, given the concept.
