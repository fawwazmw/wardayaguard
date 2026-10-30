# WardayaGuard test plan

## 1. Purpose

Define what WardayaGuard verifies about Wardaya Store, what it deliberately does
not verify, and the evidence required to call a release testable.

## 2. System under test

| Component  | Detail                                  |
| ---------- | --------------------------------------- |
| Storefront | React 19 and Vite single page app       |
| API        | Express 5 REST API, TypeScript          |
| Database   | SQLite, deterministic seed              |
| Auth       | Opaque bearer tokens stored server side |
| Money      | Integer cents, USD                      |

The application is a fixture. It exists to make behaviour observable and
controllable, not as the portfolio deliverable.

## 3. Scope

### In scope

- Authentication, session creation and revocation.
- Catalogue listing, search, sorting, product lookup.
- Cart add, merge, update, remove, quantity validation.
- Stock validation and reserved-stock absence.
- Pricing: subtotal, discount ordering, shipping threshold, totals.
- Checkout validation, order creation, stock decrement, cart clearing.
- Idempotent checkout.
- Authorization: cart and order ownership (IDOR).
- Error envelope and information leakage.
- Storefront critical journeys: login, catalogue, cart, checkout, confirmation,
  order history, mobile width, keyboard focus.
- Cross-browser execution of critical journeys (pending).

### Out of scope

- Real payment processing and PCI scope.
- Third-party shipping carriers.
- Tax calculation.
- Load and soak testing at production scale.
- Email delivery and password reset.
- Accessibility beyond the checkout journey (pending, axe-core).

## 4. Environments

| Environment | Database                  | Port | Notes                                           |
| ----------- | ------------------------- | ---- | ----------------------------------------------- |
| Local dev   | `.data/wardaya.sqlite`    | 4000 | `npm run dev:api`                               |
| Playwright  | `.data/playwright.sqlite` | 4100 | Started by `webServer`, reset before every test |
| CI          | `.data/playwright.sqlite` | 4100 | Same seed, Node 24 on Ubuntu                    |

Tests never point at the dev database. The test-only reset endpoint is mounted
only when `ALLOW_TEST_ROUTES=1`.

## 5. Test data

- The seed is deterministic: explicit ids, fixed prices, fixed stock.
- Every API test starts from a reset database, so execution order is irrelevant.
- Expectations live in `tests/fixtures/`, separate from the seed, so a seed
  change fails a test instead of silently changing what "correct" means.
- Accounts:
  - `standard@wardaya.test` / `Passw0rd!`
  - `rival@wardaya.test` / `Passw0rd!`
- Intentional fixtures: sold-out product (id 4), low-stock product (id 6, stock
  2), inactive product (id 8).

## 6. Entry criteria

- `npm ci` completes on Node 24.
- The API starts and `GET /api/health` returns `200`.
- The seed loads without error.
- No test depends on data left by a previous run.

## 7. Exit criteria

- All P1 tests pass on the target environment.
- No open Critical or High severity defect without a documented workaround.
- The HTML report from the release run is attached to the record.
- Failed tests are triaged as product defect, test defect, or environment
  failure. An unexplained red run does not count as a pass.

## 8. Risks and coverage

| Risk                                     | Impact                           | Coverage                                                 |
| ---------------------------------------- | -------------------------------- | -------------------------------------------------------- |
| Overselling the last unit                | High, customer trust and refunds | API-004 concurrency test                                 |
| Duplicate order from a retried request   | High, double charge              | CHK-005 idempotency replay                               |
| Reading another customer's order         | Critical, data breach            | API-002 IDOR test                                        |
| Wrong total after discount               | High, revenue and disputes       | CHK-003 plus unit pricing suite                          |
| Stock drift after a failed checkout      | High, silent inventory loss      | Transaction rollback in checkout, stock assertion        |
| Password or account enumeration          | Medium                           | AUTH-002 identical responses                             |
| Internal error leaking a stack trace     | Medium                           | API-005 fault injection                                  |
| Unavailable product still purchasable    | Medium                           | PROD-004                                                 |
| Layout breaks at phone width             | Medium                           | REG-004 overflow assertion                               |
| Checkout cannot be completed by keyboard | Medium                           | REG-005 focus and tab order                              |
| Flaky tests eroding trust                | Medium                           | Isolation, reset per test, flake policy in test strategy |

## 9. Reporting

- Playwright HTML report with traces retained on failure.
- `docs/test-summary-template.md` for the human summary.
- Defects follow `docs/defects/defect-template.md`.
- `docs/evidence/` holds click-through audits: console errors, contrast,
  target sizes and horizontal overflow.
- Metrics are copied from a real run. They are never estimated.
