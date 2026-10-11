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
