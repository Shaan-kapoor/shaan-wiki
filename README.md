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

### 1. DNS — the only thing blocking the site going live

`shaan.wiki` is still on Spaceship's parking nameservers. Until it points at GitHub, the site is
unreachable: this account's Pages sites all redirect to `shaankapoor.me` (set as the custom domain
on `Shaan-kapoor.github.io`), and that domain has no DNS records at all, so every project page
301s into a dead end. Giving this repo its own custom domain bypasses that entirely.

At Spaceship, on `shaan.wiki`, add four **A** records for the apex (`@`):

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

and optionally a **CNAME** for `www` → `shaan-kapoor.github.io`.

Then:

```
echo shaan.wiki > data/domain.txt && git add -A && git commit -m "Claim the domain" && git push
```

and set the custom domain under Settings → Pages. Tick **Enforce HTTPS** once the certificate
is issued (a few minutes).

### 2. The token

1. GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens**.
   Repository access: only this repo. Permissions: `Contents: Read and write`, nothing else.
   Expiry: the maximum, 366 days — one day longer than the domain, so it never needs rotating.
2. Open `tools/make-vault.html` **locally** in a browser. Paste the token and a password.
3. Save the output as `data/vault.json` and commit it.

Pages is already enabled with **GitHub Actions** as the source, and the deploy workflow is green.

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
