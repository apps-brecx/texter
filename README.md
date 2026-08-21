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
2. **Show it the work** — drop in the banner or screenshot, paste the draft, or
   both. It reads every word in the image, including the small print.
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

### Deploying

Any Node host. On Vercel, set the same variables, point `DATABASE_URL` at a
pooled connection and `DIRECT_URL` at the direct one, and set `APP_URL` to the
deployed origin.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Prisma 7 ·
PostgreSQL · Anthropic and OpenAI SDKs · session cookies backed by rows in the
database, so a password change signs every device out.
