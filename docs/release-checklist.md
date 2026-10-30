# Release checklist

A portfolio repository is only useful if a stranger can install it, run it, and
trust what it claims. Each item below is verified, not asserted.

| #   | Item                                                      | Status | Evidence                                                                                                                                             |
| --- | --------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | A fresh clone installs and runs from the documented steps | PASS   | [release verification](evidence/release-2026-10-30.md): `npm ci`, typecheck, build, 94 tests                                                         |
| 2   | Seeded data produces repeatable results                   | PASS   | Reset before every test; 243/243 executions in the [flake run](evidence/flake-2026-10-30.md)                                                         |
| 3   | Critical API and UI tests run successfully                | PASS   | 94 tests: 53 API, 28 UI, 13 unit                                                                                                                     |
| 4   | Negative and boundary cases prove meaningful validation   | PASS   | `CART-004`, `CART-005`, `API-002`, `API-004`, `API-005`, `CHK-005`, expired discount, `REG-003` dependency failure                                   |
| 5   | CI runs automatically on pull requests                    | PASS   | Pull requests [#1](https://github.com/fawwazmw/wardayaguard/pull/1) to [#4](https://github.com/fawwazmw/wardayaguard/pull/4) show red and green runs |
| 6   | HTML reports and failure evidence are accessible          | PASS   | [Public report](https://fawwazmw.github.io/wardayaguard/), CI artifacts, traces, screenshots                                                         |
| 7   | A genuine failure is documented                           | PASS   | Four [defect reports](defects/README.md), including a Critical authorization leak                                                                    |
| 8   | README metrics match the real run                         | PASS   | 94 total, 81 Playwright, 28 UI, 13 unit, 243 flake executions                                                                                        |
| 9   | Critical journeys work across browsers                    | PASS   | Nightly matrix on Chromium, Firefox and WebKit                                                                                                       |
| 10  | Accessibility is measured                                 | PASS   | axe-core, WCAG A/AA, zero violations on seven page states                                                                                            |
| 11  | A deployment artifact is live                             | PASS   | [Demo](https://wardayaguard.onrender.com): health 200, 8 products, login, test routes 404; Docker smoke test in CI                                   |
| 12  | Repository hygiene                                        | PASS   | No tracked secrets or databases; 21/21 links return 200                                                                                              |

## Reproduce the checklist

```bash
git clone https://github.com/fawwazmw/wardayaguard.git
cd wardayaguard
npm ci
npx playwright install chromium
npm run typecheck
npm run build:web
npm test
npm run test:e2e
```

## Honest gaps

- The demo's SQLite is ephemeral on Render's free plan, so orders and stock
  reset on restart. That is a hosting property, not missing functionality.
- Item 7 is fault injection, not production incidents. Every report says so.
- The flake number covers one worker and one machine. Parallel workers and
  network variance are not measured.
