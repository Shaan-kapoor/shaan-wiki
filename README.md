# shaan.wiki

A one-year writing machine with a death clock on it.

From **1 August 2026** to **31 July 2027**, one entry a day and one gym tick a day.
Each day's entry is editable until midnight IST, then sealed forever. Missed days stay missed.

The domain expires on **30 July 2027 at 01:18 IST** — day 364 of 365. The year cannot be
finished without renewing.

Design notes, decisions and open questions live in [idea.md](idea.md).

## How it works

```
entries/2026-08-01.md   one markdown file per day. The archive. The source of truth
data/gym.json           { "2026-08-01": true }
data/vault.json         the GitHub token, encrypted with your password
        ↓
build/build.py          no dependencies. Renders everything
        ↓
public/                 static HTML. Deployed to GitHub Pages by Actions
```

Everything on the site — the index, the grids, streaks, word counts, backlinks — is **derived**.
Delete `public/` and it rebuilds identically. Delete the whole site and `entries/` rebuilds it.
That is why the archive is text files and not a database.

## Writing

Go to [shaan.wiki/write](https://shaan.wiki/write), type the password, write, publish.
No code editor, no local setup, works on a phone or a Kindle.

The password decrypts a GitHub token held in `data/vault.json` (PBKDF2-SHA256, 600k iterations,
AES-GCM). The token is never stored in plaintext and never leaves the device. A raw token in a
public repo would be auto-revoked by GitHub secret scanning within minutes; an encrypted blob is
invisible to it.

**The password is the only thing protecting the token, and the blob is public.** Use four random
words. If it ever leaks, the worst case is a defacement of one repo of public writing, revertible
from git history.

## Setup, once

1. Create a fine-grained GitHub token: repository access limited to this repo,
   permissions `Contents: Read and write`, expiry 366 days (one day longer than the domain).
2. Open `tools/make-vault.html` **locally** in a browser. Paste the token and a password.
3. Save the output as `data/vault.json` and commit it.
4. Settings → Pages → Source: **GitHub Actions**.
5. Point the domain's DNS at GitHub Pages.

## Building locally

```
python3 build/build.py     # writes public/
```

Python 3.8+. No dependencies, no npm, no lockfile, nothing to update.

## Rules

- One entry per day. The filename is the date, so this is structural.
- Editable until 00:00 IST. Then never.
- No backfilling — the endpoint only ever writes today's date.
- Black and white only.
- No JavaScript required to read anything.
- The only animation on the site is the intro, and its purpose is to stop.
