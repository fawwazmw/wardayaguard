# Deployment

Two public artifacts, both live.

## 1. Playwright report (live)

- **URL:** https://fawwazmw.github.io/wardayaguard/
- **Source:** the `playwright-report` artifact from the latest successful CI run
  on `main`.
- **Workflow:** `.github/workflows/report.yml`, triggered by `workflow_run` when
  CI completes.
- **Pages configuration:** `build_type: workflow`, no branch publishing.

The report is public. It contains only the seeded demo accounts and test data.
It never contains production data, because there is no production data.

Why a separate workflow instead of a step in CI: a newer commit must not cancel
a Pages deployment mid-flight. The report job has its own `pages` concurrency
group with `cancel-in-progress: false`.

### Transient Pages failures

GitHub Pages occasionally returns a 500 when creating a deployment. The workflow
removes any stale `github-pages` artifact from an earlier attempt before
uploading, so re-running the failed job is safe:

```bash
gh run rerun <run-id> --failed
```

Without that cleanup, a rerun uploads a second artifact with the same name and
`deploy-pages` refuses to choose between them. That happened once, on attempt 2
of run 41071438847; attempt 3 succeeded after the duplicates were removed.

## 2. Full demo (live)

- **URL:** https://wardayaguard.onrender.com
- **Host:** Render free plan, Docker, single web service.
- **Health check:** `/api/health`.

Verified on 2026-10-30:

| Check             | Result                                          |
| ----------------- | ----------------------------------------------- |
| `/api/health`     | 200                                             |
| Storefront        | 200, root element present                       |
| Catalogue         | 8 seeded products                               |
| Login             | `standard@wardaya.test` works                   |
| `/api/test/reset` | 404, test routes disabled                       |
| Browser smoke     | 8 cards, search filters to 1, no console errors |

When `apps/storefront/dist` exists, the API serves the storefront and falls back
to `index.html` for client-side routes. One container exposes the UI and `/api`
on the same origin, so there is no CORS configuration and no second host.

### Local Docker

```bash
npm run build:web
docker build -t wardayaguard .
docker run --rm -p 4000:4000 -e ALLOW_TEST_ROUTES=0 wardayaguard
```

Open http://127.0.0.1:4000. The database is created and seeded on first boot.

### Render blueprint

`render.yaml` defines a free Docker web service with:

- `NODE_ENV=production`
- `ALLOW_TEST_ROUTES=0`, so `/api/test/*` is never mounted
- `DATABASE_PATH=.data/wardaya.sqlite`
- health check on `/api/health`

To deploy: Render dashboard, **New**, **Blueprint**, connect
`fawwazmw/wardayaguard`, apply. No secrets are required.

### Demo caveats

- **Ephemeral data.** The free plan has no persistent disk. SQLite is recreated
  and seeded on every restart, so orders and stock reset. That is fine for a
  demo. A durable deployment needs managed Postgres or a paid persistent disk,
  which is out of scope for this project.
- **Cold starts.** Free instances sleep and take roughly 30 seconds to wake.
- **Test routes.** Disabled by environment variable, not by deleting code. The
  guard is in `apps/api/src/app.ts`.

## What is intentionally not deployed

- The test suite does not run against the hosted demo. It runs against its own
  seeded database in CI, on every push and pull request.
- No third-party payment, shipping or email provider.
