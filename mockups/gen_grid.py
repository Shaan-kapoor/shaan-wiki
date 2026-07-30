#!/usr/bin/env python3
"""Generate a static, JS-free gym-grid mockup for shaan.wiki.

Everything is <table> based so it renders on Kindle's ancient WebKit.
Data is simulated: the real site pulls from data/gym.json.
"""
import random
from datetime import date, timedelta

START = date(2026, 7, 29)          # domain registration day
END = date(2027, 7, 29)            # domain expiry
TODAY = date(2027, 2, 27)          # simulated "today" so the grid is part-filled
DAYS = (END - START).days          # 365

random.seed(7)

# --- simulate attendance -----------------------------------------------------
gym = {}
d = START
streak_mood = 0.7
while d < TODAY:
    # weekends less likely, plus drifting motivation
    streak_mood += random.uniform(-0.07, 0.07)
    streak_mood = max(0.45, min(0.97, streak_mood))
    p = streak_mood * (0.5 if d.weekday() >= 5 else 1.0)
    gym[d] = random.random() < p
    d += timedelta(days=1)

went = sum(1 for v in gym.values() if v)
elapsed = len(gym)

# current streak
cur = 0
d = TODAY - timedelta(days=1)
while d >= START and gym.get(d):
    cur += 1
    d -= timedelta(days=1)

# longest streak
longest = run = 0
d = START
while d < TODAY:
    run = run + 1 if gym.get(d) else 0
    longest = max(longest, run)
    d += timedelta(days=1)

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def cls(d):
    if d < START or d >= END:
        return None
    if d >= TODAY:
        return "f"          # future
    return "y" if gym.get(d) else "n"


def cell(d, tip=False):
    """tip=True adds a title attribute. Kept off the dense grids to keep the
    page small — the Kindle has no hover anyway, and 1500 title attrs is 30 KB."""
    c = cls(d)
    if c is None:
        return '<td class="x"></td>'
    if d == TODAY:
        c += " t"
    if not tip:
        return '<td class="%s"></td>' % c
    label = d.strftime("%a %-d %b %Y") + (" — went" if cls(d) == "y" else
                                          " — no" if cls(d) == "n" else "")
    return '<td class="%s" title="%s"></td>' % (c, label)


# --- Variant A: full year, 53 cols x 7 rows (GitHub shape) -------------------
def variant_year():
    grid_start = START - timedelta(days=START.weekday())   # back to Monday
    weeks = []
    d = grid_start
    while d < END:
        weeks.append(d)
        d += timedelta(days=7)

    # month header: group consecutive week-columns by month
    spans, prev, count = [], None, 0
    for w in weeks:
        m = (w + timedelta(days=3)).month      # midweek decides the month
        if m != prev:
            if prev is not None:
                spans.append((prev, count))
            prev, count = m, 1
        else:
            count += 1
    spans.append((prev, count))

    head = '<tr><th class="wd"></th>'
    for m, n in spans:
        head += '<th class="mo" colspan="%d">%s</th>' % (n, MONTHS[m - 1] if n >= 2 else "")
    head += "</tr>"

    rows = ""
    for r in range(7):
        lab = WD[r] if r in (0, 2, 4) else ""
        rows += '<tr><th class="wd">%s</th>' % lab
        for w in weeks:
            rows += cell(w + timedelta(days=r))
        rows += "</tr>"

    return '<table class="grid year">%s%s</table>' % (head, rows)


# --- Variant B: month blocks -------------------------------------------------
def variant_months():
    out = []
    m = date(START.year, START.month, 1)
    while m < END:
        first = m
        nxt = date(m.year + (m.month == 12), (m.month % 12) + 1, 1)
        block = '<th class="mo" colspan="7">%s %s</th>' % (MONTHS[m.month - 1], str(m.year)[2:])
        block = "<tr>" + block + "</tr><tr>" + "".join(
            '<th class="wd2">%s</th>' % w[0] for w in WD) + "</tr>"
        d = first - timedelta(days=first.weekday())
        while d < nxt:
            block += "<tr>"
            for r in range(7):
                cd = d + timedelta(days=r)
                block += cell(cd) if first <= cd < nxt else '<td class="x"></td>'
            block += "</tr>"
            d += timedelta(days=7)
        out.append('<table class="grid month">%s</table>' % block)
        m = nxt
    return '<div class="months">%s</div>' % "".join(out)


# --- Variant C: vertical, 7 cols x 53 rows -----------------------------------
def variant_vertical():
    grid_start = START - timedelta(days=START.weekday())
    head = "<tr><th class='wd'></th>" + "".join(
        '<th class="wd2">%s</th>' % w[0] for w in WD) + "</tr>"
    rows, d, prev_m = "", grid_start, None
    while d < END:
        m = (d + timedelta(days=3)).month
        lab = MONTHS[m - 1] if m != prev_m else ""
        prev_m = m
        rows += '<tr><th class="wd">%s</th>' % lab
        for r in range(7):
            rows += cell(d + timedelta(days=r))
        rows += "</tr>"
        d += timedelta(days=7)
    return '<table class="grid vert">%s%s</table>' % (head, rows)


# --- Variant D: recent 8 weeks, large ----------------------------------------
def variant_recent():
    end = TODAY + timedelta(days=(6 - TODAY.weekday()))
    start = end - timedelta(days=55)
    head = '<tr><th class="wd"></th>'
    d = start
    cols = []
    while d <= end:
        cols.append(d)
        d += timedelta(days=7)
    prev_m = None
    for w in cols:
        m = (w + timedelta(days=3)).month
        head += '<th class="mo">%s</th>' % (MONTHS[m - 1] if m != prev_m else "")
        prev_m = m
    head += "</tr>"
    rows = ""
    for r in range(7):
        rows += '<tr><th class="wd">%s</th>' % WD[r]
        for w in cols:
            rows += cell(w + timedelta(days=r), tip=True)
        rows += "</tr>"
    return '<table class="grid big">%s%s</table>' % (head, rows)


CSS = """
*{-webkit-box-sizing:border-box;box-sizing:border-box}
body{margin:0;padding:20px 16px 60px;background:#fff;color:#000;
  font:16px/1.5 Georgia,"Times New Roman",Times,serif;
  -webkit-text-size-adjust:100%}
.wrap{max-width:760px;margin:0 auto}
h1{font-size:20px;font-weight:normal;letter-spacing:.18em;text-transform:uppercase;
  margin:0 0 4px;padding-bottom:10px;border-bottom:2px solid #000}
h2{font-size:15px;font-weight:normal;letter-spacing:.14em;text-transform:uppercase;
  margin:44px 0 4px;padding-bottom:6px;border-bottom:1px solid #000}
p{max-width:620px}
p.note{font-size:13px;line-height:1.6;color:#4a4a4a;margin:8px 0 18px;font-style:italic}
p.lead{font-size:14px;margin:10px 0 22px}
.stats{font-size:13px;letter-spacing:.06em;margin:12px 0 0;color:#000;
  font-variant-numeric:tabular-nums}
.stats b{font-weight:normal;border-bottom:2px solid #000}

/* ---- grid core: tables only, no flex, no grid, no custom properties ---- */
table.grid{border-collapse:separate;border-spacing:1px;margin:14px 0 0}
table.grid td{padding:0;width:6px;height:6px;line-height:6px;font-size:0;
  border:1px solid #ddd;background:#fff}
table.grid td.y{background:#000;border-color:#000}
table.grid td.n{background:#fff;border-color:#9a9a9a}
table.grid td.f{background:#fff;border-color:#e6e6e6}
table.grid td.x{border:0;background:transparent}
table.grid td.t{outline:1px solid #000;outline-offset:1px}
table.grid th{padding:0;font-weight:normal;font-size:9px;color:#555;
  font-family:-apple-system,Helvetica,Arial,sans-serif}
table.grid th.wd{width:26px;text-align:left;padding-right:5px;font-size:9px}
table.grid th.wd2{font-size:8px;text-align:center}
table.grid th.mo{text-align:left;font-size:9px;letter-spacing:.08em;padding-bottom:3px}

table.big td{width:22px;height:22px}
table.big th.wd{width:34px}
table.vert td{width:20px;height:20px}
table.vert th.wd{width:34px}
.months{font-size:0}
table.month{display:-webkit-inline-box;display:inline-table;vertical-align:top;
  margin:0 14px 16px 0}
table.month td{width:11px;height:11px}

@media (min-width:700px){
  table.year td{width:9px;height:9px}
  table.year th.wd{width:32px;font-size:10px}
  table.year th.mo{font-size:10px}
}
.legend{font-size:11px;color:#555;margin-top:10px;
  font-family:-apple-system,Helvetica,Arial,sans-serif}
.legend i{display:inline-block;width:9px;height:9px;border:1px solid #ddd;
  vertical-align:-1px;margin:0 4px 0 12px;font-style:normal}
.legend i.y{background:#000;border-color:#000}
.legend i.n{border-color:#9a9a9a}
.legend i:first-child{margin-left:0}
.scroll{overflow-x:auto}
hr{border:0;border-top:1px solid #000;margin:0}
.verdict{border:1px solid #000;padding:14px 16px;margin:18px 0 0;font-size:14px}
.verdict b{letter-spacing:.1em;text-transform:uppercase;font-size:11px;
  font-weight:normal;display:block;margin-bottom:6px;
  font-family:-apple-system,Helvetica,Arial,sans-serif}
"""

LEGEND = ('<p class="legend"><i class="y"></i>went<i class="n"></i>didn\'t'
          '<i class="f"></i>not yet</p>')

html = """<title>shaan.wiki — gym grid mockup</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>%s</style>
<div class="wrap">
<h1>Gym grid &mdash; layout options</h1>
<p class="note">Static HTML. No JavaScript, no CSS Grid, no flexbox, no custom
properties, no web fonts, no dark mode. Tables only &mdash; so this should render
on the Kindle browser exactly as it does here. That's the point: it's a fidelity
test, not a showcase. If a layout below is broken on your Kindle, that layout is out.</p>
<p class="lead">Simulated data: %d of %d days elapsed, pretending today is
%s (day %d of 365). The real site reads <code>data/gym.json</code>.</p>
<p class="stats"><b>%d</b> gym days of %d &middot; <b>%d%%</b> &middot;
current streak <b>%d</b> &middot; longest <b>%d</b></p>

<h2>A &middot; Full year, weeks as columns</h2>
<p class="note">GitHub's shape. 53 columns &times; 7 rows, sized to fit a phone
and a Kindle with no sideways scrolling. The whole year in one object &mdash;
including the empty future.</p>
%s
%s
<div class="verdict"><b>Why this one</b>Weekday patterns read vertically &mdash;
you can see which days you always skip. The unfilled future is visible, which is
what ties the grid to the countdown. Fits 320px because black-on-white survives
at 6px in a way five shades of green never could.</div>

<h2>B &middot; Month blocks</h2>
<p class="note">What most habit apps do. Twelve small calendars. More legible
per month, but the year stops being a single image.</p>
%s
%s

<h2>C &middot; Vertical &mdash; 7 columns, scrolling down</h2>
<p class="note">Same data rotated. Fits phone width perfectly and scrolls the
natural direction, but it's 53 rows long and you never see the year at once.</p>
<div class="scroll">%s</div>

<h2>D &middot; Recent eight weeks, large</h2>
<p class="note">Not an alternative &mdash; a companion. This is what actually
matters day to day, and it's legible at arm's length on e-ink. Could sit on the
home page with the full year on <code>/gym</code>.</p>
%s
%s
</div>
""" % (CSS, elapsed, DAYS, TODAY.strftime("%-d %B %Y"), elapsed,
       went, elapsed, round(100 * went / elapsed), cur, longest,
       variant_year(), LEGEND, variant_months(), LEGEND,
       variant_vertical(), variant_recent(), LEGEND)

import sys
open(sys.argv[1], "w").write(html)
print("wrote %s — %d days simulated, %d gym" % (sys.argv[1], elapsed, went))
