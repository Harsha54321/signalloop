# SignalLoop — Infinite Circuit Puzzle

A new-style rotation puzzle: every level is a grid of circuit tiles that
start scrambled. Click a tile to rotate it 90°. The level is solved the
instant every tile lines up so the whole grid forms one connected,
loose-end-free circuit.

**Levels are unlimited** — they're generated procedurally on the backend
from the level number (deterministic seed, so level 137 always looks the
same puzzle every time you play it), and difficulty (grid size, extra
loops, scramble amount) keeps scaling forever. There is no level cap.

Stack: **Python + Django + Django REST Framework** (API + SQL/SQLite
storage) and **React.js / JavaScript / HTML / CSS** (frontend).

```
signalloop/
├── backend/            Django project (API + level generator + SQL DB)
│   ├── manage.py
│   ├── puzzle_backend/ settings/urls/wsgi
│   └── game/           models, views, serializers, level_generator.py, tests
└── frontend/           React app (create-react-app style)
    ├── public/
    └── src/
        ├── components/ GameBoard, Tile, LevelSelect
        ├── utils/       tile rotation geometry
        └── api.js       fetch calls to the Django API
```

## 1. Backend setup (Django API + SQL database)

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
source venv/bin/activate

pip install -r requirements.txt

python manage.py migrate
python manage.py runserver
```

The API now runs at `http://localhost:8000/api/`:

| Method | Endpoint                              | Purpose                              |
|--------|----------------------------------------|---------------------------------------|
| GET    | `/api/level/<n>/`                      | Generate/return puzzle for level `n` |
| GET    | `/api/progress/<player_id>/`           | List a player's saved progress        |
| POST   | `/api/progress/`                       | Submit a completed level's result     |
| GET    | `/api/leaderboard/<n>/`                | Top 10 fastest times for level `n`    |

Uses SQLite by default (zero config, file at `backend/db.sqlite3`). To
use Postgres/MySQL instead, just change the `DATABASES` block in
`puzzle_backend/settings.py` — the rest of the code (models, views)
doesn't change.

Optional: `python manage.py createsuperuser` then visit
`http://localhost:8000/admin/` to browse player progress in a SQL table.

## 2. Frontend setup (React)

In a **second terminal**:

```bash
cd frontend
npm install
npm start
```

Opens at `http://localhost:3000` and talks to the Django API via the
`proxy` field in `package.json` (already configured to `localhost:8000`).

## 3. How to play

- Click any tile to rotate it 90° clockwise.
- Goal: rotate every tile until the whole grid forms one connected
  circuit with no dangling/broken connectors.
- Stars (1–3) are awarded based on how close your move count is to par.
- Progress and best times are saved per-browser (a random player id in
  `localStorage`) and persisted in the SQL database via the API.
- Levels unlock in order, but you can scroll/"Load more" to see the
  puzzle grid growing — it never runs out.

## Difficulty scaling (how "unlimited levels" works)

`game/level_generator.py`:
1. Picks a grid size from the level number (grows every 4 levels, caps
   at 10×10 so it stays playable).
2. Builds a random spanning tree over the grid (randomized Prim's
   algorithm) — this is *always* solvable by construction.
3. Adds extra random connections (loops) as the level number grows,
   increasing the number of open sides per tile.
4. Randomly scrambles each tile's rotation.

Because generation is deterministic per `level_number` (SHA-256-derived
seed), level 9999 is exactly the same puzzle every time anyone loads it,
with no need to store millions of levels in the database.

## Hints (work offline)

Every level gives **3 hints**. Tap **💡 Hint** under the board: it highlights
one wrong tile with a gold glow and a badge (`↻2` = tap it 2 times), and the
message names its row and column. The badge counts down as you tap, the
button is disabled while a hint is active, and hints reset on each new level.
Hints are computed in the browser (`frontend/src/utils/hints.js`) from the
level data, so they need no internet. They do not reduce your stars.

## Offline play (no internet needed)

SignalLoop is an offline-first PWA:

- **Levels are generated in the browser** (`frontend/src/utils/levelGenerator.js`),
  a twin of `backend/game/level_generator.py` - same hash + same PRNG, so
  level N is the identical puzzle online and offline. If you change the
  algorithm, change both files.
- **Progress is saved on the device** (localStorage). When there is no
  internet, results are queued and sent to the Django API automatically
  when the connection returns.
- **A service worker** (`frontend/public/service-worker.js`) caches the app,
  so it opens with no internet after the first visit. It is only active in
  the production build (`npm run build`), never during `npm start`.
- Needs internet: leaderboard and the community rating summary. Your own
  rating is saved and sent later.
- Install like an app: Chrome/Edge -> address bar "Install" icon; Android
  -> menu -> "Add to Home screen"; iPhone -> Share -> "Add to Home Screen".

## Notes

- No user accounts/login required — a per-browser id tracks progress.
- CORS is open for local development (`CORS_ALLOW_ALL_ORIGINS = True`);
  tighten this before any real deployment.
- Backend generator logic has been validated with a standalone script
  (connectivity + edge consistency checked across 1000+ levels) and a
  Django `TestCase` suite in `game/tests.py`.

## 4. Deploying for free (GitHub → auto-deploy)

Yes — you push this repo to GitHub once, connect it to two free
platforms, and both redeploy automatically on every `git push`. No
manual upload step.

**1. Push to GitHub**
```bash
cd signalloop
git init
git add .
git commit -m "SignalLoop"
git branch -M main
git remote add origin https://github.com/<you>/signalloop.git
git push -u origin main
```

**2. Backend → [Render](https://render.com) (free)**
- Sign up at render.com with your GitHub account (no card needed).
- New → Blueprint → pick this repo. Render reads `render.yaml` at the
  repo root and creates the web service **and** a free Postgres
  database automatically (already wired via `DATABASE_URL`).
- If you'd rather do it by hand instead of the Blueprint: New → Web
  Service → select repo → Root Directory `backend` → Build Command
  `./build.sh` → Start Command `gunicorn puzzle_backend.wsgi:application`,
  then add a free Postgres from New → PostgreSQL and copy its
  "Internal Database URL" into the web service's `DATABASE_URL` env var.
- Free tier notes: spins down after 15 min idle (first request after
  that takes ~30-60s to wake up), 750 free instance-hours/month, and
  the free Postgres database expires after 30 days (recreate it or
  upgrade to keep data — fine for a portfolio/demo project).

**3. Frontend → [Vercel](https://vercel.com) or [Netlify](https://netlify.com) (free)**
- Sign up with GitHub → New Project → import this repo → set **Root
  Directory** to `frontend`.
- Build command `npm run build`, output directory `build` (Vercel/Netlify
  auto-detect this for Create React App).
- Add an environment variable `REACT_APP_API_BASE` = your Render backend
  URL + `/api`, e.g. `https://signalloop-backend.onrender.com/api`
  (see `frontend/.env.example`).
- Deploy. Every push to `main` now redeploys the frontend automatically.

**4. Lock down CORS**
- Back in Render's dashboard, set the backend's `CORS_ALLOWED_ORIGINS`
  env var to your live frontend URL (e.g.
  `https://signalloop.vercel.app`) instead of leaving it open to `*`.

**Alternatives if you outgrow the free tier:** PythonAnywhere (free,
Django-friendly, no sleep, but limited outbound requests) or a
Hetzner/Oracle Cloud "always free" VM if you want full control instead
of a managed platform.

