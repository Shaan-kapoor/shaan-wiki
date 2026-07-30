#!/usr/bin/env python3
"""shaan.wiki — the whole build.

Reads entries/*.md and data/gym.json, writes public/.
No dependencies. Python 3.8+.

Everything on the site is derived from entries/ and data/. Delete public/
and it rebuilds identically. That is the durability guarantee: the archive
is text files, and this script is only a renderer.
"""
import html
import json
import os
import re
import shutil
import sys
from datetime import date, datetime, timedelta, timezone

# --- configuration -----------------------------------------------------------
IST = timezone(timedelta(hours=5, minutes=30))
DAY_ONE = date(2026, 8, 1)
DAY_COUNT = 365
LAST_DAY = DAY_ONE + timedelta(days=DAY_COUNT - 1)          # 2027-07-31
EXPIRY = datetime(2027, 7, 29, 19, 48, 39, tzinfo=timezone.utc)
SITE = "shaan.wiki"

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")
OUT = os.path.join(ROOT, "public")

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def today_ist():
    return datetime.now(IST).date()


def day_number(d):
    """1-based day index, or None if outside the year."""
    n = (d - DAY_ONE).days + 1
    return n if 1 <= n <= DAY_COUNT else None


# --- tiny front-matter + markdown -------------------------------------------
def parse_frontmatter(text):
    if not text.startswith("---"):
        return {}, text
    end = text.find("\n---", 3)
    if end == -1:
        return {}, text
    raw, body = text[3:end], text[end + 4:]
    meta = {}
    for line in raw.strip().splitlines():
        if ":" not in line:
            continue
        k, v = line.split(":", 1)
        v = v.strip()
        if v.startswith("[") and v.endswith("]"):
            v = [i.strip() for i in v[1:-1].split(",") if i.strip()]
        elif v.lower() in ("true", "false"):
            v = v.lower() == "true"
        meta[k.strip()] = v
    return meta, body.lstrip("\n")


INLINE = [
    (re.compile(r"`([^`]+)`"), lambda m: "<code>%s</code>" % m.group(1)),
    (re.compile(r"\*\*([^*]+)\*\*"), lambda m: "<strong>%s</strong>" % m.group(1)),
    (re.compile(r"(?<![\w*])\*([^*\n]+)\*(?![\w*])"),
     lambda m: "<em>%s</em>" % m.group(1)),
    (re.compile(r"\[([^\]]+)\]\((https?://[^)\s]+)\)"),
     lambda m: '<a href="%s" rel="noopener">%s</a>' % (m.group(2), m.group(1))),
]


def slugify(s):
    s = re.sub(r"[^\w\s-]", "", s.lower()).strip()
    s = re.sub(r"[\s_]+", "-", s)
    return re.sub(r"-{2,}", "-", s).strip("-") or "untitled"


def inline_md(s, wikilinks=None, known=None):
    s = html.escape(s, quote=False)

    def wiki(m):
        target = m.group(1).strip()
        slug = slugify(target)
        if wikilinks is not None:
            wikilinks.append(target)
        if known is not None and slug not in known:
            return '<a href="/wanted/" class="wanted" title="not written yet">%s</a>' % (
                html.escape(target))
        return '<a href="/%s/">%s</a>' % (slug, html.escape(target))

    s = re.sub(r"\[\[([^\]]+)\]\]", wiki, s)
    for pat, fn in INLINE:
        s = pat.sub(fn, s)
    return s


def markdown(text, wikilinks=None, known=None):
    """Deliberately small. Paragraphs, headings, lists, quotes, code, rules."""
    out, lines, i = [], text.split("\n"), 0
    para, listbuf, listtag = [], [], None

    def flush_para():
        if para:
            out.append("<p>%s</p>" % inline_md(" ".join(para), wikilinks, known))
            del para[:]

    def flush_list():
        nonlocal listtag
        if listbuf:
            items = "".join("<li>%s</li>" % inline_md(x, wikilinks, known)
                            for x in listbuf)
            out.append("<%s>%s</%s>" % (listtag, items, listtag))
            del listbuf[:]
            listtag = None

    while i < len(lines):
        line = lines[i].rstrip()
        if line.startswith("```"):
            flush_para(); flush_list()
            i += 1
            buf = []
            while i < len(lines) and not lines[i].startswith("```"):
                buf.append(html.escape(lines[i]))
                i += 1
            out.append("<pre><code>%s</code></pre>" % "\n".join(buf))
        elif not line.strip():
            flush_para(); flush_list()
        elif re.match(r"^-{3,}$", line.strip()):
            flush_para(); flush_list()
            out.append("<hr>")
        elif line.startswith("#"):
            flush_para(); flush_list()
            lvl = len(line) - len(line.lstrip("#"))
            lvl = min(max(lvl, 1), 4) + 1          # h1 in the doc becomes h2
            out.append("<h%d>%s</h%d>" % (
                lvl, inline_md(line.lstrip("#").strip(), wikilinks, known), lvl))
        elif line.startswith("> "):
            flush_para(); flush_list()
            out.append("<blockquote>%s</blockquote>"
                       % inline_md(line[2:], wikilinks, known))
        elif re.match(r"^[-*] ", line):
            flush_para()
            listtag = "ul"
            listbuf.append(line[2:])
        elif re.match(r"^\d+\. ", line):
            flush_para()
            listtag = "ol"
            listbuf.append(re.sub(r"^\d+\. ", "", line))
        else:
            flush_list()
            para.append(line.strip())
        i += 1
    flush_para(); flush_list()
    return "\n".join(out)


# --- templating --------------------------------------------------------------
INCLUDE = re.compile(r"\{\{>\s*([\w./-]+)\s*\}\}")
VAR = re.compile(r"\{\{\s*([\w_]+)\s*\}\}")


def render(tpl, ctx, depth=0):
    if depth > 10:
        raise RuntimeError("include loop")
    tpl = INCLUDE.sub(
        lambda m: render(read(os.path.join(SRC, m.group(1))), ctx, depth + 1), tpl)
    return VAR.sub(lambda m: str(ctx.get(m.group(1), "")), tpl)


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def minify_css(css):
    """The stylesheet is inlined into every page, so its size is paid on every
    request. The source keeps its comments; the reader doesn't pay for them."""
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    css = re.sub(r"\s+", " ", css)
    css = re.sub(r"\s*([{}:;,>])\s*", r"\1", css)
    css = re.sub(r";}", "}", css)
    return css.strip()


def write(relpath, content):
    path = os.path.join(OUT, relpath)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    return len(content.encode("utf-8"))


# --- the grid ----------------------------------------------------------------
def grid(marks, today, label):
    """53x7 table. marks is a set of dates. Weeks are columns, Mon..Sun rows."""
    start = DAY_ONE - timedelta(days=DAY_ONE.weekday())
    weeks = []
    d = start
    while d <= LAST_DAY:
        weeks.append(d)
        d += timedelta(days=7)

    spans, prev, count = [], None, 0
    for w in weeks:
        m = (w + timedelta(days=3)).month
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
        rows += '<tr><th class="wd">%s</th>' % (WD[r] if r in (0, 2, 4) else "")
        for w in weeks:
            cd = w + timedelta(days=r)
            # Byte-golfed on purpose: this runs 371 times per grid and twice
            # per page. Unclassed <td> is a future day, which is most of the
            # year at the start. Tooltips are dropped — there is no hover on
            # a phone or an e-ink screen, and they cost 26 KB.
            if cd < DAY_ONE or cd > LAST_DAY:
                rows += "<td class=x></td>"
            elif cd == today:
                rows += '<td class="%s t"></td>' % ("y" if cd in marks else "n")
            elif cd > today:
                rows += "<td></td>"
            else:
                rows += "<td class=%s></td>" % ("y" if cd in marks else "n")
        rows += "</tr>"

    return ('<figure class="gridwrap"><figcaption>%s</figcaption>'
            '<table class="grid">%s%s</table></figure>' % (label, head, rows))


def streaks(marks, today):
    cur = 0
    d = today
    while d >= DAY_ONE and d not in marks:      # today not yet done doesn't break it
        d -= timedelta(days=1)
        break
    d = today if today in marks else today - timedelta(days=1)
    while d >= DAY_ONE and d in marks:
        cur += 1
        d -= timedelta(days=1)
    longest = run = 0
    d = DAY_ONE
    while d <= min(today, LAST_DAY):
        run = run + 1 if d in marks else 0
        longest = max(longest, run)
        d += timedelta(days=1)
    return cur, longest


# --- load --------------------------------------------------------------------
def load_entries():
    entries = []
    edir = os.path.join(ROOT, "entries")
    for name in sorted(os.listdir(edir)):
        if not name.endswith(".md"):
            continue
        meta, body = parse_frontmatter(read(os.path.join(edir, name)))
        try:
            d = datetime.strptime(name[:10], "%Y-%m-%d").date()
        except ValueError:
            print("  skip (bad filename): %s" % name)
            continue
        title = meta.get("title") or d.strftime("%-d %B %Y")
        entries.append({
            "date": d,
            "day": day_number(d),
            "title": title,
            "slug": slugify(title),
            "gym": bool(meta.get("gym")),
            "tags": meta.get("tags") or [],
            "body": body,
            "words": len(body.split()),
        })
    entries.sort(key=lambda e: e["date"])
    return entries


def load_gym():
    path = os.path.join(ROOT, "data", "gym.json")
    if not os.path.exists(path):
        return set()
    with open(path, encoding="utf-8") as f:
        raw = json.load(f)
    out = set()
    for k, v in raw.items():
        if v:
            try:
                out.add(datetime.strptime(k, "%Y-%m-%d").date())
            except ValueError:
                pass
    return out


# --- build -------------------------------------------------------------------
def main():
    today = today_ist()
    entries = load_entries()
    gym_days = load_gym() | {e["date"] for e in entries if e["gym"]}
    written = {e["date"] for e in entries}
    known = {e["slug"] for e in entries}

    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)

    css = minify_css(read(os.path.join(SRC, "css", "base.css")))
    dnum = day_number(today) or (0 if today < DAY_ONE else DAY_COUNT)
    remaining = max((EXPIRY - datetime.now(timezone.utc)).days, 0)

    base = {
        "site": SITE,
        "css": css,
        "day": "%03d" % dnum,
        "day_plain": str(dnum),
        "day_count": str(DAY_COUNT),
        "remaining": str(remaining),
        "expiry_iso": EXPIRY.isoformat(),
        "year": str(today.year),
        "entry_count": str(len(entries)),
        "gym_count": str(len([d for d in gym_days if d <= today])),
        "elapsed": str(max(dnum, 0)),
        "total_words": str(sum(e["words"] for e in entries)),
    }

    gcur, glong = streaks(gym_days, today)
    wcur, wlong = streaks(written, today)
    base.update({
        "gym_streak": str(gcur), "gym_longest": str(glong),
        "write_streak": str(wcur), "write_longest": str(wlong),
        "gym_grid": grid(gym_days, today, "Gym"),
        "write_grid": grid(written, today, "Writing"),
    })

    pages = os.path.join(SRC, "pages")
    total = 0

    # entries
    wanted = {}
    for e in entries:
        links = []
        bodyhtml = markdown(e["body"], links, known)
        for t in links:
            if slugify(t) not in known:
                wanted.setdefault(t, []).append(e)
        ctx = dict(base)
        ctx.update({
            "title": html.escape(e["title"]),
            "slug": e["slug"],
            "body": bodyhtml,
            "entry_day": str(e["day"]),
            "entry_date": e["date"].strftime("%A, %-d %B %Y"),
            "entry_date_iso": e["date"].isoformat(),
            "words": str(e["words"]),
            "gym_line": "Went to the gym." if e["gym"] else "No gym.",
            "stub": ('<p class="stub">This entry is a stub.</p>'
                     if e["words"] < 50 else ""),
        })
        total += write("%s/index.html" % e["slug"],
                       render(read(os.path.join(pages, "entry.html")), ctx))
        total += write("%s.txt" % e["slug"], e["body"])
        total += write("day/%d/index.html" % e["day"],
                       '<meta http-equiv="refresh" content="0;url=/%s/">' % e["slug"])

    # index
    recent = entries[-12:][::-1]
    items = "".join(
        '<li><a href="/%s/">%s</a><span class="meta">Day %d &middot; %s</span></li>'
        % (e["slug"], html.escape(e["title"]), e["day"],
           e["date"].strftime("%-d %b")) for e in recent)
    ctx = dict(base, title=SITE, recent=items or
               '<li class="empty">Nothing written yet.</li>')
    total += write("index.html", render(read(os.path.join(pages, "index.html")), ctx))

    # archive
    rows = ""
    for n in range(1, DAY_COUNT + 1):
        d = DAY_ONE + timedelta(days=n - 1)
        e = next((x for x in entries if x["date"] == d), None)
        if e:
            cell = '<a href="/%s/">%s</a>' % (e["slug"], html.escape(e["title"]))
        elif d > today:
            cell = '<span class="future">&mdash;</span>'
        else:
            cell = '<span class="miss">missed</span>'
        rows += '<tr><td class="n">%d</td><td class="d">%s</td><td>%s</td></tr>' % (
            n, d.strftime("%-d %b"), cell)
    ctx = dict(base, title="Archive", rows=rows)
    total += write("archive/index.html",
                   render(read(os.path.join(pages, "archive.html")), ctx))
    total += write("archive.txt", "\n\n\n".join(
        "%s\nDay %d  %s\n%s\n\n%s" % ("=" * 60, e["day"],
                                      e["date"].isoformat(), e["title"], e["body"])
        for e in entries))

    # gym
    ctx = dict(base, title="Gym")
    total += write("gym/index.html", render(read(os.path.join(pages, "gym.html")), ctx))

    # wanted
    witems = "".join(
        '<li><b>%s</b> &mdash; linked from %s</li>' % (
            html.escape(t), ", ".join('<a href="/%s/">%s</a>'
                                      % (e["slug"], html.escape(e["title"]))
                                      for e in es))
        for t, es in sorted(wanted.items()))
    ctx = dict(base, title="Wanted", items=witems or
               '<li class="empty">Nothing wanted yet.</li>')
    total += write("wanted/index.html",
                   render(read(os.path.join(pages, "wanted.html")), ctx))

    # write + 404
    for name, out in (("write.html", "write/index.html"), ("404.html", "404.html")):
        ctx = dict(base, title="Write" if "write" in name else "Not found")
        total += write(out, render(read(os.path.join(pages, name)), ctx))

    # static
    for sub in ("js",):
        srcdir = os.path.join(SRC, sub)
        for f in os.listdir(srcdir):
            total += write("%s/%s" % (sub, f), read(os.path.join(srcdir, f)))
    shutil.copy(os.path.join(ROOT, "data", "gym.json"),
                os.path.join(OUT, "gym.json"))
    vault = os.path.join(ROOT, "data", "vault.json")
    if os.path.exists(vault):
        shutil.copy(vault, os.path.join(OUT, "vault.json"))
    # Only claim the custom domain once DNS actually points at GitHub. A CNAME
    # file makes Pages redirect the github.io URL to shaan.wiki, so shipping it
    # early makes the site unreachable at both addresses. Create data/domain.txt
    # containing the domain when the nameservers are ready.
    domain = os.path.join(ROOT, "data", "domain.txt")
    if os.path.exists(domain):
        write("CNAME", read(domain).strip() + "\n")
    write(".nojekyll", "")

    print("built %d entries, %d pages, %.1f KB"
          % (len(entries), len(os.listdir(OUT)), total / 1024.0))
    print("day %d of %d, %d days until the domain expires" % (dnum, DAY_COUNT, remaining))


if __name__ == "__main__":
    sys.exit(main())
