# Texter

A copy desk for teams whose marketing English is written by people who don't
speak American English natively.

The problem isn't grammar. Copy that comes back from a team writing in a second
language is usually *correct* and still lands wrong: the register is off, the
politeness is borrowed from another business culture, the idiom is regional, and
the rhythm isn't how an American reads. Pasting it into a chatbot doesn't fix
that, because the person doing the pasting can't tell what's wrong either.

Texter reads the artwork or the draft, checks it against rules **your** team
taught it, asks the questions it actually needs answered, then writes.

## How a review goes

1. **Pick the format** — email, banner, Instagram, Facebook, SMS, WhatsApp,
   push, product page, landing page.
2. **Show it the work** — drop in a **PDF or an image** (banner, screenshot,
   export), paste the draft, or both. It reads every word, including the small
   print, and every page of a PDF. Big photos are shrunk automatically on the
   way in, so a 30 MB phone shot uploads fast and still reads fine.
3. **It audits what exists** — each problem quoted verbatim, with the exact
   replacement and why, rated fix / tighten / nit.
4. **It questions you** — three to six questions, sharpest first, most of them
   answerable with one click. Nothing gets written until it knows the offer, the
   deadline and what happens when someone clicks. Anything you skip becomes an
   assumption it flags in the output.
5. **It writes** — format-aware fields with real character limits, alternates to
   swap in, and a separate list of text that needs changing on the artwork.
6. **You approve** — and if you edited anything first, it works out *why* and
   proposes new house rules.

## Campaigns — pieces that know about each other

A promotion is never one piece. The launch email, the homepage banner and the
Instagram post all have to agree on the offer, the dates and the deadline, and
answering the same three questions for each of them is where the time goes.

Link a review to a campaign and Texter reads everything already in it before it
writes: what each earlier piece was for, the answers a human gave, and the copy
that actually shipped. That changes both halves of the job:

- **It stops asking what it already knows.** If the email established "30% off,
  March 3–7, past customers", the banner doesn't ask again — it asks the one
  thing that's new, like how much room the artwork leaves for a subhead.
- **It stops contradicting itself.** The offer, dates, prices, product names and
  claims have to match what shipped. A different discount is treated as a bug,
  not a variation. It still writes fresh sentences, so the campaign reads
  consistent rather than copy-pasted — and if a brief genuinely conflicts with
  something already out the door, it flags that instead of quietly picking one.

Start a campaign from the new-review screen, or link a review to one afterwards
from the review itself. Every piece shows its siblings and their status, and
History filters by campaign.

## The brain

Every workspace has one, and it goes into the prompt on every single review.

- **Teach it directly.** Rules, wording swaps (`kindly` → `please`), examples and
  product facts. Scope any of them to one format or leave them global.
- **It teaches itself.** When you edit its copy before shipping, it diffs your
  version against its own, extracts the durable preferences, and files them as
  pending. You confirm or discard — it never silently rewrites its own rules.
- **Rules that keep proving themselves gain weight** and move up the prompt.

It ships knowing the classics: `kindly`, `do the needful`, `revert back`,
`as per`, `prepone`, `esteemed customer`, `please find attached`, US dates and
money, contractions, one idea per sentence.

## Voices

Four ship by default — **Clean**, **Warm**, **Sharp**, **Boardroom** — and you
can write your own with formality, energy and emoji dials. Pick one per review.

## Workspaces, people, admin

One workspace per team, fully separate history, rules and voices. Owners and
admins invite by email, change roles, remove people and send password resets.
Members run reviews and teach the brain.

No email provider configured? Invite links appear in Settings for an admin to
send by hand, and password-reset links go to the server log.

---

## Running it

Requires Node 20+ and any PostgreSQL.

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL, AUTH_SECRET, one AI key
npm run db:migrate        # or: npm run db:push
npm run dev
```

Open http://localhost:3000, create a workspace — the first account becomes its
owner, and the default voices and starter rules are seeded automatically.

### Environment

| Variable | Required | What it does |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `DIRECT_URL` | yes | Unpooled connection, used by the Prisma CLI |
| `DATABASE_POOL_MAX` | no | Connections per instance (default 5) |
| `AUTH_SECRET` | yes | Long random string |
| `APP_URL` | yes | Real origin — invite and reset links are built from it |
| `ANTHROPIC_API_KEY` | one of | Claude models |
| `OPENAI_API_KEY` | one of | GPT models |
| `RESEND_API_KEY` | no | Sends invites and resets by email |
| `MAIL_FROM` | no | From address on those emails |

Which model gets used is a per-workspace setting under **Settings → The engine**;
keys stay in the environment and are never written to the database.

### Deploying to Render

`render.yaml` in the repo root is a Blueprint — in Render choose **New →
Blueprint**, point it at this repo, and it creates the web service with the
right build and start commands. Or create a Web Service by hand with:

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Build command | `npm ci --include=dev && npx prisma migrate deploy && npm run build` |
| Start command | `npm start` |
| Health check path | `/login` |

`--include=dev` matters: the build needs the Prisma CLI and TypeScript, and
Render's build step can otherwise skip dev dependencies.

Then set the environment variables from the table above. Two Render-specific
notes:

- **`APP_URL` must be the live origin** (`https://texter.onrender.com`, or your
  custom domain). Invite and password-reset links are built from it, so getting
  it wrong sends people to localhost.
- **Let Render generate `AUTH_SECRET`** and then leave it alone — rotating it
  signs every session out.

### Neon

Neon gives you two connection strings for the same database. Use both:

- `DATABASE_URL` → the **pooled** string, the one with `-pooler` in the host.
  This is what the running app uses.
- `DIRECT_URL` → the **direct** string, without `-pooler`. Only the Prisma CLI
  uses it, during `migrate deploy`.

Keep `?sslmode=require` on both. `DATABASE_POOL_MAX=5` is a sensible starting
point for one Render instance; raise it if you scale up, and watch Neon's
connection limit if you scale out.

### Other hosts

Anything that runs Node works the same way — set the variables, run
`prisma migrate deploy` during the build, then `npm start`.

One caveat if you move off Render: uploads accept PDFs up to 20 MB and images
up to 40 MB, which is larger than the request-body limit on some serverless
platforms (Vercel caps a function request at 4.5 MB). On those, uploads need to
go to object storage from the browser instead of through the app.

## Design

Two colours, both taken from the logo: **navy `#17293D`** for structure and
type, **leaf green `#5BBE4C`** for the spark. Primary buttons are inverted —
navy on a light page, near-white on a dark one — which never fails contrast and
leaves green free to mean "this is live". Every value is a CSS variable in
`src/app/globals.css`; `--brand-navy` and `--brand-leaf` at the top feed the
rest, so re-tinting the whole app is a two-line change.

Type is **Plus Jakarta Sans** throughout with **Geist Mono** for copy blocks and
diffs. Light and dark are both first-class: the theme follows the system by
default and the toggle in Settings overrides it, applied before first paint so
there's no white flash.

The mark is drawn as inline SVG (`src/components/brand/mark.tsx`) rather than
imported, so the T inherits the current text colour, the leaf keeps the brand
green, and the loader can animate the two separately — the leaf springs off the
arm on mount and breathes while the AI is working.

## Mobile

Built as a web app that behaves like a native one:

- Bottom tab bar with a raised **New** action, safe-area aware, frosted.
- iOS large titles, sheets that slide up from the bottom, tap-scale feedback,
  no grey tap highlight, no rubber-band behind fixed chrome.
- Add to Home Screen works — manifest, apple-touch icon, theme colour per
  scheme, `viewport-fit=cover` so it paints under the notch.
- Inputs are 16px minimum, because anything smaller makes iOS zoom on focus.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Prisma 7 ·
PostgreSQL · Anthropic and OpenAI SDKs · Plus Jakarta Sans + Geist Mono ·
session cookies backed by rows in the database, so a password change signs every
device out.
