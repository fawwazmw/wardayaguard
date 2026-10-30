# Release checklist

A portfolio repository is only useful if a stranger can install it, run it, and
trust what it claims. Each item below is verified, not asserted.

| #   | Item                                                      | Status  | Evidence                                                                                                                                             |
| --- | --------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | A fresh clone installs and runs from the documented steps | PASS    | [release verification](evidence/release-2026-10-30.md): `npm ci`, typecheck, build, 92 tests                                                         |
| 2   | Seeded data produces repeatable results                   | PASS    | Reset before every test; 237/237 executions in the [flake run](evidence/flake-2026-10-30.md)                                                         |
| 3   | Critical API and UI tests run successfully                | PASS    | 92 tests: 52 API, 27 UI, 13 unit                                                                                                                     |
| 4   | Negative and boundary cases prove meaningful validation   | PASS    | `CART-004`, `CART-005`, `API-002`, `API-004`, `API-005`, `CHK-005`, expired discount                                                                 |
| 5   | CI runs automatically on pull requests                    | PASS    | Pull requests [#1](https://github.com/fawwazmw/wardayaguard/pull/1) to [#4](https://github.com/fawwazmw/wardayaguard/pull/4) show red and green runs |
| 6   | HTML reports and failure evidence are accessible          | PASS    | [Public report](https://fawwazmw.github.io/wardayaguard/), CI artifacts, traces, screenshots                                                         |
| 7   | A genuine failure is documented                           | PASS    | Four [defect reports](defects/README.md), including a Critical authorization leak                                                                    |
| 8   | README metrics match the real run                         | PASS    | 92 total, 79 Playwright, 27 UI, 13 unit, 237 flake executions                                                                                        |
| 9   | Critical journeys work across browsers                    | PASS    | Nightly matrix on Chromium, Firefox and WebKit                                                                                                       |
| 10  | Accessibility is measured                                 | PASS    | axe-core, WCAG A/AA, zero violations on seven page states                                                                                            |
| 11  | A deployment artifact exists                              | PARTIAL | Docker image built and smoke-tested in CI; Render blueprint ready, demo not hosted                                                                   |
| 12  | Repository hygiene                                        | PASS    | No tracked secrets or databases; 18/18 links return 200                                                                                              |

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

- The hosted demo is the only incomplete item. It needs the repository owner's
  Render account; the blueprint is `render.yaml`.
- Item 7 is fault injection, not production incidents. Every report says so.
- The flake number covers one worker and one machine. Parallel workers and
  network variance are not measured.
