# Växla

Byt arbete mot det du behöver.

Växla är en marknad där arbetskraft är betalmedel. Om du inte har pengar (eller vill undvika lån) kan någon annan sponsra ett köp — du betalar tillbaka med timmar: dela ut reklamblad, klippa gräs, hjälpa till vid flytt.

## Idé

1. Du publicerar ett önskemål (t.ex. AirPods för 1 366 kr).
2. En person eller ett företag betalar varan, eller publicerar ett uppdrag.
3. Du jobbar av värdet i timmar.
4. När timmarna är klara är bytet klart.

## Databas (P5)

Shared persistence uses **Neon Postgres via Vercel Marketplace** (not Supabase).

### Env vars

After linking Neon to the Vercel project `vaxla`, these are injected automatically:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | **yes** | Pooled Neon connection string (preferred) |
| `POSTGRES_URL` | fallback | Legacy Vercel Postgres name — also accepted |
| `POSTGRES_PRISMA_URL` | fallback | Accepted if present |
| `DATABASE_URL_UNPOOLED` / `POSTGRES_URL_NON_POOLING` | optional | Accepted as last-resort fallbacks |
| `VAXLA_WRITE_TOKEN` | recommended | Shared secret for write hardening (see below) |
| `VAXLA_REQUIRE_WRITE_TOKEN` | optional | Set to `1` for invite-only writes (admin token required) |

### Write hardening (early access)

`POST /api/trades` and `PATCH /api/trades/[id]` are gated:

1. **Admin token** — `Authorization: Bearer <VAXLA_WRITE_TOKEN>` or header `X-Vaxla-Write-Token: <token>` bypasses ownership checks.
2. **Signed actor cookie** — browser clients get an httpOnly `vaxla_actor` cookie (HMAC-signed with the write token, or derived from `DATABASE_URL` if the token is unset). Creates bind `owner_id`; sponsoring binds `sponsor_id`.
3. **Status machine** — only forward transitions: `open → sponsored|in_progress → done` (via `sponsored → in_progress` when applicable). Illegal jumps return `409`.
4. **Validation** — max lengths, `kind` enum, integer caps on `valueSek` / `hours`, `https` image URLs.
5. **Rate limits** — best-effort per-instance limits on POST/PATCH (blunts casual spam on Vercel).

Invite-only mode: set `VAXLA_REQUIRE_WRITE_TOKEN=1` so anonymous cookie minting is disabled and every write needs the admin token.

Locally:

```bash
vercel link --project vaxla --scope mikaels-projects-902560d4
vercel env pull .env.local
```

Without `DATABASE_URL`, the app serves the 6 seed trades from code (SSR still works). Creates/status updates return `503` until Postgres is linked.

### Provision Neon (Mikael)

1. Open [vaxla → Storage](https://vercel.com/mikaels-projects-902560d4/vaxla/stores)
2. **Create Database** → **Neon** (Marketplace)
3. Accept terms, choose the **Free** plan, name e.g. `vaxla-db`
4. Connect to **Production**, **Preview**, and **Development**
5. Redeploy (or wait for the next preview from this PR)

First request creates the `trades` table and seeds the 6 demo rows.

CLI alternative (after `vercel login`):

```bash
vercel install neon --name vaxla-db --plan free -e production -e preview -e development
```

## Köra lokalt

```bash
npm install
npm run dev -- --port 43123
```

Öppna [http://127.0.0.1:43123](http://127.0.0.1:43123).

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Neon Postgres (`@neondatabase/serverless`)
