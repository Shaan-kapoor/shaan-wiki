# feedback.md

Shaan's feedback, and what each piece of it actually implies. One section per point.
The rule for this document: figure out *why* the note is right before deciding *what* to change,
because most of these notes are symptoms of one underlying mistake.

Last updated: 2026-07-31

---

## 0. The underlying mistake

Five of the six notes below are the same error wearing different clothes.

I designed **the appearance of minimalism** instead of designing minimally. Hairline rules,
uppercase letter-spaced labels, underlined links, bordered inputs, a stats line, a section heading
above every block — each individually defensible, and together a lot of furniture. That is
first-order minimalism: take a normal page and style it down.

Real subtraction happens a level earlier — **fewer elements, not quieter elements.** A label you
delete is worth more than a label you grey out. This is what "too much thinking about minimalism
from the first perspective" means, and it's the correct read.

The working rule from here: *every mark on the page has to earn its place against the alternative
of not existing.* Not against the alternative of being smaller.

---

## 1. White on black

**Note:** "Why have you made a dark mode website? It should be white on black."

**Why it's right.** I built a theme that followed the operating system — black-on-white by day,
white-on-black by night. That's not a design decision, it's a deferral of one. A monochrome site
has exactly one identity choice available to it, which is *which of the two is the ground*, and I
handed that choice to a system setting.

There's also a use-case argument. Most entries get written late at night on a phone in a dark room.
A white field is a lamp pointed at your face. A black field lets the screen stop being a light
source and lets the text be the only thing emitting.

And a philosophical one, which matters on this project: **presence should read as light.** On black,
a day you wrote is a bright mark and a day you missed is nearly nothing. The metaphor runs the
right way round. On white it's inverted — absence becomes the bright thing.

**What changes.**
- One committed theme. No `prefers-color-scheme`, no toggle, no inversion. The site has an opinion.
- Body prose is **not** pure `#fff`. On black, white text haloes and reads optically heavier than
  it measures, so full white for running text is fatiguing. Prose sits around `#c9c9c9`; pure white
  is reserved for emphasis and links.
- That reservation is load-bearing — see §2. Luminance becomes the hierarchy system that replaces
  every line I'm about to delete.
- Weights go **down** and letter-spacing goes very slightly **up**, because light-on-dark thickens
  strokes optically.

---

## 2. The underlines and the lines generally

**Note:** "You have added a lot of random underlines, which does not make it look minimalistic."

**Why it's right.** A rule is a line drawn where a boundary already exists. If whitespace already
communicates the boundary, the rule is redundant — it's a designer not trusting space to do its job.

The cost is higher here than on a normal site. In a monochrome system, **a rule is made of exactly
the same material as the text**: a black-and-white mark. It doesn't sit in a separate visual layer
the way a pale grey line does next to colour. So every line competes directly with the words.

I had seven distinct kinds of line: link underlines, a rule under every `h2`, a rule under the
masthead, one above the footer, one under each entry in a list, one under each archive row, and an
underline under every number in the stats line. On a page whose entire content is text, that is a
lot of drawing.

**The replacement.** Monochrome has exactly three usable axes, and I was only using one:

| Axis | Use |
|---|---|
| **Space** | Section breaks. A 60px gap separates better than a 1px line, and adds nothing |
| **Luminance** | Hierarchy. `#fff` emphasis · `#c9c9c9` prose · `#6a6a6a` apparatus |
| **Scale & weight** | Rank. Size does what a heading rule was pretending to do |

**What changes.**
- **No underlines on links.** A link is pure white against grey prose. Unambiguous, and it costs
  no ink. On hover it brightens — no line appears.
- **No rule under headings.** Space above, nothing below.
- **No rules in lists or tables.** Row separation by leading alone.
- Target: **zero rules in the entire stylesheet**, and if one survives it has to argue for itself.
- Section headings get deleted wherever the content is self-evident. The recent-entries list does
  not need a heading that says "Recent".

---

## 3. The grid squares

**Note:** "All those boxes are not of equal height and width, so they come out very weird.
There should be some spacing between them."

**Why it's right — and it's my bug, not a taste issue.** I built the grid as a `<table>` because
the Kindle was originally assumed to be an old one that couldn't be trusted with CSS Grid.

In table layout, `width` and `height` on a `<td>` are **suggestions**. The table algorithm
distributes available width across the row and will stretch cells to fit; with `border-spacing` and
per-cell borders in play, the rendered box is not the box I specified. So the squares were never
actually guaranteed to be square. They looked wrong because they *were* wrong.

Then the reason for the table disappeared — the Kindle turned out to be the newest model, which
has CSS Grid. **The constraint went away and I left the workaround in place.** That's the real
error here.

**What changes.**
- Rebuild as **CSS Grid**: `grid-auto-flow: column`, 7 explicit rows, `aspect-ratio: 1` on every
  cell, and a real `gap`. Geometry guaranteed by the layout engine rather than negotiated with it.
- **Delete the cell borders.** An outlined empty square is a *drawn* square — it spends ink on a
  day that didn't happen. Wrong emphasis.
- Three states by luminance only, matching §1's rule that presence is light:

```
  went      #ededed   a bright mark
  didn't    #232323   present, but barely — you can see the shape of the year
  future    #0d0d0d   almost nothing. It hasn't happened
```

- Real breathing room between squares. Bigger cells, fewer of them per view if needed.

---

## 4. Don't mention the domain expiring

**Note:** "You should not mention that the domain is expiring anywhere on the website."

**Why it's right.** The countdown was my idea and I over-invested in it. Two problems with it.

It **narrates the constraint instead of embodying it.** The site is already finite: 365 slots, and
the archive stops. That finitude is visible in the grid every single day without a word of
explanation. A banner announcing it is the design equivalent of explaining your own joke.

And it **puts anxiety in the furniture.** A number counting down on every page turns a private
daily practice into a public performance with a clock on it. The pressure should come from the
empty square, which is quiet and personal, not from a countdown, which is loud and theatrical.

Rubin's whole move is to not explain. The deadline stays real — it just stops being announced.

**What changes.**
- Every "days until the domain expires" string is deleted from the masthead, the footer and the
  editor.
- The day number can stay — `Day 178` is a fact about the archive, not a threat. Under review.
- `expiry_iso`, the live countdown script, and the whole ticking apparatus come out.
- The finitude stays where it belongs: in the 365 slots and in `idea.md`, which is for us.

---

## 5. The writing experience

**Note:** "The experience of writing should be amazing. Take some input from Notion — it's so
minimalistic, and there's a very nice animation to writing."

**Why it's right.** This is the most important note in the list, because this is the surface that
decides whether the project survives to day 365. I gave it a form: uppercase field labels, boxed
inputs with 1px borders, a checkbox in a row, two buttons. It looks like something you file, not
something you write in.

**What Notion actually does**, stripped to principles:

1. **There is no form.** No borders, no field labels, no visible inputs. The document is the UI.
2. **The title is just large text** with a soft placeholder, in the same face as the body.
3. **What you type is what it looks like.** No preview, no split pane, no mode.
4. **The chrome appears only when needed** and is otherwise absent.
5. **Motion is subtle and functional** — a placeholder fading, a state cross-fading. Nothing bounces.
6. **The caret is waiting for you** the moment the page opens.

**What changes.**
- Delete every label, border and box from the editor. Title and body are bare text on the page.
- **The editor renders in exactly the same face, size and leading as the published entry.** Writing
  and reading become the same act — WYSIWYG by construction rather than by preview.
- Title placeholder is `Untitled`, greyed. Body placeholder is a single quiet line.
- Autofocus the body. The page opens ready to be written in.
- The gym tick is one small quiet control, not a boxed checkbox in a bordered row.
- Save state is one line of text that cross-fades between *Saved* and *Publishing*. No spinner,
  no toast, no modal.
- The only motion: placeholder fade, state cross-fade, and controls fading in once there's
  something to publish. Everything under 200ms.

---

## 6. The password

**Note:** "I just want to type in Breezer. That is all."

**Decided — `breezer`.** I raised the exposure once and Shaan has confirmed twice; it's his call
and the matter is closed. Recording the trade so it's on the record rather than forgotten:

`data/vault.json` is public, so the encrypted blob can be attacked offline forever with no rate
limit. A single dictionary word doesn't survive that, PBKDF2 iterations notwithstanding. Realistic
worst case is a defacement of a public wiki, reverted with `git revert`. Nothing else is reachable —
the token is scoped to this one repository with `Contents` permission and nothing more.

**One thing that follows:** the token must stay scoped to exactly this repo. Never widen it, and
never reuse the password anywhere that matters.

---

## Typeface

Not in the feedback list as a principle, but "the font is not great" was, and the specimens are in
[`mockups/type.html`](mockups/type.html). Six directions, set on black, judged from a screenshot
rather than from imagination.

**Chosen: A — literary serif.** `ui-serif` → New York on Apple, Charter, then Georgia.

Why it wins on black specifically: Times (D) goes thin and slightly fragile when reversed out;
the system sans (B) and Helvetica (F) read as product UI rather than as someone's writing;
monospace throughout (C) is genuinely striking and the most literal expression of "the archive is
plain text," but 15px mono across 365 entries of prose is tiring, and it makes personal writing
look like console output.

**The rule that comes out of it, which matters more than the choice:**

> **Serif is for human words. Monospace is for machine apparatus.**
> Titles and prose are the person. Dates, day numbers, and the grid are the system.
> A title is content, so it never gets set as a label.

That's the same serif/mono hybrid as specimen E, but with the assignment corrected — E made the
entry title machine apparatus, which is exactly backwards.

---

## Order of work

1. Invert to white-on-black, one committed theme
2. Delete the rules and underlines; rebuild hierarchy on luminance and space
3. Rebuild the grid in CSS Grid with true squares and real gaps
4. Strip every mention of the domain expiring
5. Rebuild the editor as a Notion-style writing surface
6. Screenshot, look at it, iterate — not ship-and-hope

---

## What testing actually caught

Screenshots at real device widths, not guesses. Four things were wrong and only one
of them was visible from reading the code.

**1. The grid squares were never square — and the fix wasn't the obvious one.**
Moving from `<table>` to CSS Grid was right but not sufficient. Putting `aspect-ratio: 1`
on the *cells* creates a circular dependency: the cell needs a width to compute its height,
the width comes from a `1fr` track, and the track needs the row height. Browsers break that
cycle at roughly a 5px floor per column, which overflows any phone. Moving the ratio to the
*container* (`aspect-ratio: 53/7`) makes both axes definite and the cycle disappears.

**2. Chrome clamps its window to 500px minimum on macOS.** Two rounds of "fixes" chased an
overflow that did not exist: the page was being laid out at 500px and the screenshot cropped
to 393px, which looks exactly like overflow. Narrow viewports now come from nesting the page
in a fixed-width iframe. Worth remembering — it would have wasted a lot more time.

**3. The editor rendered straight through the password gate.** `.compose { display: block }`
is a class selector and beats the user-agent sheet's `[hidden]` rule, so `hidden` did nothing.
Fixed with an explicit `[hidden] { display: none !important }`.

**4. The title could not wrap.** It was an `<input>`, so a long title ran off the right edge
of the phone. It is now a one-row `<textarea>` grown to fit, which is what Notion uses and why
Notion titles wrap. Enter moves to the body instead of inserting a newline.

## Where it landed

- **Phone (393×852)** — all five icons fit, the year sits inside its margins at ~4.6px squares.
  Small, but black-on-white at maximum contrast stays legible where five shades of green would not.
- **Kindle (618×824)** — the best of the three. Roomy grid, comfortable measure. The theme
  toggle matters most here: e-ink renders black-on-white more crisply than the inverse, so
  the light theme is one tap away.
- **Desktop (1440×900)** — 680px column centred, grid at ~10px squares, day numbers ranged right.

Remaining judgement call: the phone grid is dense at 4.6px per day. It reads as a dot matrix
rather than a chart, which suits the project, but if it feels too tight in the hand the fix is
a shorter window on phones (last 26 weeks) with the full year kept on `/gym`.
