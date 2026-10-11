# Växla

Byt arbete mot det du behöver.

Växla är en marknad där arbetskraft är betalmedel. Om du inte har pengar (eller vill undvika lån) kan någon annan sponsra ett köp — du betalar tillbaka med timmar: dela ut reklamblad, klippa gräs, hjälpa till vid flytt.

## Idé

1. Du publicerar ett önskemål (t.ex. AirPods för 1 366 kr).
2. En person eller ett företag betalar varan, eller publicerar ett uppdrag.
3. Du jobbar av värdet i timmar.
4. När timmarna är klara är bytet klart.

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

Data i den här MVP:n är mockad i kod plus lokala önskemål i `localStorage`. Ingen inloggning eller databas krävs för att prova flödet.
