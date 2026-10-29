# WardayaGuard

**Regression test suite for Wardaya Store, a seeded e-commerce stack.**
TypeScript, Playwright, Vitest, Express, SQLite, GitHub Actions.

Wardaya Store is the system under test. WardayaGuard is the harness that proves
its pricing, inventory, checkout and authorization rules hold.

> **Status: in progress.** The API and unit suites are implemented and passing.
> The storefront and the UI suite are next. Every number below comes from a real
> local run on 2026-10-29, not an estimate.

## Current results

| Suite                                  | Tests  | Status        |
| -------------------------------------- | ------ | ------------- |
| Unit (pricing rules)                   | 13     | Passing       |
| API (contract, authz, checkout, stock) | 50     | Passing       |
| UI (customer journeys)                 | 0      | Not built yet |
| **Total**                              | **63** | **Passing**   |

Latest run: Node 24.18.0, macOS, SQLite seed, `npm test`. Duration under 10
seconds. Cross-browser execution starts with the storefront.

## What the suite actually demonstrates

- **Business rules, not button clicks.** Totals are asserted as exact integers
  from the API and from a pure pricing module, including the boundary at 4999
  versus 5000 cents and the half-up rounding rule.
- **Idempotent checkout.** Replaying the same `Idempotency-Key` returns the
  original order with `200` and `replayed: true`, one order row, one stock
  decrement.
- **No overselling.** Two customers hold the last two units at the same time.
  Exactly one checkout succeeds and stock lands on zero.
- **Authorization.** A second customer reading the first customer's order gets
  `404`, not `403`, so the API does not confirm the id exists.
- **Information leakage.** A thrown server fault returns a generic `500` with
  no stack trace, no internal message (fault injection endpoint, test only).
- **Deterministic data.** Every test starts from a reset seed. Execution order
  cannot change a result.
- **Catalogue contract.** Eight products are asserted against a fixture that is
  written independently of the seed, so silent drift fails the suite.

## Architecture

```
Playwright (API project)          Vitest
        |                            |
        v                            v
Express 5 API  <---- pricing.ts (pure functions)
        |
        v
   SQLite (seeded)  <--- reset endpoint, test-only
```

| Layer       | Choice          | Reason                                                           |
| ----------- | --------------- | ---------------------------------------------------------------- |
| Test runner | Playwright      | API and (later) browser tests in one runner, HTML report, traces |
| Unit runner | Vitest          | Fast boundary tests on pricing, no I/O                           |
| API         | Express 5 + zod | Small surface, explicit validation                               |
| Database    | SQLite          | Zero setup, deterministic, fast CI. Tradeoff in Limitations      |
| CI          | GitHub Actions  | Typecheck, unit, API on every push and pull request              |

## Quick start

Requires Node 22.5 or newer.

```bash
npm ci
cp .env.example .env      # optional for local dev
npm run seed              # optional: the API seeds an empty database on boot
npm run dev:api           # http://127.0.0.1:4000
```

In a second shell:

```bash
npm test                  # unit + API
npm run report            # open the last HTML report
```

Tests are self-contained: Playwright starts the API on port **4100** with its
own database (`.data/playwright.sqlite`), so a dev server on port 4000 is left
alone.

## Commands

| Command             | What it does                       |
| ------------------- | ---------------------------------- |
| `npm run dev:api`   | API with watch mode on port 4000   |
| `npm run seed`      | Reset the dev database to the seed |
| `npm run test:unit` | Pricing rules with Vitest          |
| `npm run test:api`  | API suite with Playwright          |
| `npm test`          | Unit, then API                     |
| `npm run typecheck` | TypeScript, no emit                |
| `npm run lint`      | ESLint                             |
| `npm run format`    | Prettier write                     |
| `npm run report`    | Open the Playwright HTML report    |

To measure flakiness rather than guess:

```bash
npx playwright test --project=api --repeat-each=3
```

## Seeded data

Accounts, password `Passw0rd!`:

| Email                   | Purpose                                       |
| ----------------------- | --------------------------------------------- |
| `standard@wardaya.test` | Primary customer                              |
| `rival@wardaya.test`    | Second customer, used for authorization tests |

Products are intentionally awkward: **Nightcap Beanie** is sold out, **Archive
Jacket** has stock 2, **Ghost Shell** is inactive. Discount codes: `SAVE10`,
`SAVE25`, and `EXPIRED10` (inactive).

## Test design

- Test ids are area prefixed (`AUTH-001`, `CART-004`, `API-004`). Defects use
  `WARD-DEF-nnn`.
- `tests/fixtures/` holds expectations. It does not import the seed, so a seed
  change cannot silently redefine correctness.
- `tests/support/fixtures.ts` resets the database before every test through an
  auto fixture. Authorization tests get two independent clients.
- Assertions target the machine readable `error.code`, not prose.
- `trace: retain-on-failure` rather than `on-first-retry`, because local runs
  have zero retries and the trace is exactly what a local failure needs.
- The API suite runs with one worker. SQLite writes are serialized in one
  process, and the reset endpoint is global. Parallel workers are a later
  improvement with a database per worker.

Traceability: [docs/test-cases.md](docs/test-cases.md).
Specification the tests defend: [docs/business-rules.md](docs/business-rules.md).

## Known limitations

- SQLite serializes writes in one process. The oversell test proves the guarded
  stock update, not distributed locking. Two API instances against one database
  is the follow-up.
- No tax, no payment provider, no carrier integration.
- No rate limiting or account lockout.
- API tests use a global reset and one worker. Per-worker databases are planned.
- App, report and defect metrics are only published after a real run.
- Fault injection endpoint exists only while `ALLOW_TEST_ROUTES=1`.

## Roadmap

- [x] Deterministic seed, schema, business rules
- [x] Pricing unit suite
- [x] API contract, auth, cart, checkout, stock, authorization, error leakage
- [x] CI workflow with HTML report artifact
- [ ] Storefront: login, catalogue, cart, checkout
- [ ] UI critical journeys and page objects
- [ ] Checkout accessibility with axe-core
- [ ] Planted-defect lifecycle: introduce, detect, report, fix, regression
- [ ] Chromium on PR, full browser matrix nightly
- [ ] Deployed demo and published HTML report
- [ ] Flake rate published from a repeat run
- [ ] One deep failure investigation write-up with a trace

## Repository layout

```
apps/api/            Express API, schema, seed, pricing, routes
tests/
  api/               Playwright API specs
  unit/              Vitest pricing specs
  fixtures/          Expectations and test data
  support/           API client, fixtures, types
docs/                Test plan, strategy, cases, business rules, templates
playwright.config.ts API project, webServer, report and trace policy
```

## Documentation

| File                                                               | Purpose                                       |
| ------------------------------------------------------------------ | --------------------------------------------- |
| [docs/test-plan.md](docs/test-plan.md)                             | Scope, environments, risks, exit criteria     |
| [docs/test-strategy.md](docs/test-strategy.md)                     | Layers, isolation, flake and browser policy   |
| [docs/test-cases.md](docs/test-cases.md)                           | Traceability matrix, automated versus planned |
| [docs/business-rules.md](docs/business-rules.md)                   | The specification under test                  |
| [docs/defects/defect-template.md](docs/defects/defect-template.md) | Defect report format                          |
| [docs/test-summary-template.md](docs/test-summary-template.md)     | Run summary format                            |

## License

MIT. See [LICENSE](LICENSE).
