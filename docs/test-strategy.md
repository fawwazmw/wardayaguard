# Test strategy

## Approach

Risk based, not volume based. The suite prioritises places where a bug costs
money, data, or trust: totals, stock, duplicate orders, and authorization. The
count of tests is an output, never a target.

## Layers

| Layer | Tool                    | What it proves                                | Why here                                      |
| ----- | ----------------------- | --------------------------------------------- | --------------------------------------------- |
| Unit  | Vitest                  | Pricing rules, rounding, thresholds           | Fast, exhaustive on boundaries, no I/O        |
| API   | Playwright `APIRequest` | Validation, authz, idempotency, stock, totals | Tests the contract the UI depends on          |
| UI    | Playwright              | The customer can complete a journey           | Only for behaviour that exists in the browser |

Rule of thumb: assert a business rule at the lowest layer that can observe it.
A UI test for a discount calculation is slower, flakier, and weaker evidence
than an API test plus a unit test. The UI test is reserved for the journey.

## Assertions

- Assert observable behaviour, not implementation details.
- Prices and totals are asserted as exact integers, not as ranges.
- Error tests assert the status, the machine readable `code`, and the absence of
  leaked internals.
- Contract tests assert the full fixture, so silent catalogue drift fails.

## Isolation

- `tests/support/fixtures.ts` and `tests/support/app-fixtures.ts` expose an auto
  fixture that resets the database before every test. The UI project resets
  through the Vite proxy, so it sees the same seed as the API project.
- No test depends on execution order.
- Two customers exist so authorization can be tested without creating
  accounts at runtime.
- Sessions are created by logging in, never by inserting rows directly.

## Page objects and selectors

- Page objects live in `tests/support/pages/` and expose intent
  (`addToCart('Aurora Hoodie')`), not selectors.
- Locators use role, label and accessible name first. Test ids are limited to
  product cards, cart lines, order rows and money outputs, where a role-based
  locator would be ambiguous.
- No CSS chains and no positional selectors, so a layout change does not break
  the suite for the wrong reason.
- `exact: true` is used wherever a short accessible name is a substring of
  another control. That ambiguity caused seven false failures in the first UI
  run and was fixed in the page objects, not by loosening assertions.

## State and accessibility audit

Assertions cover behaviour. A separate click-through audit covers what is easy
to miss:

- loading, empty and error states on catalogue, cart, orders and search
- per-element contrast against the real background
- interactive targets below 44px
- horizontal overflow at 390px
- console and page errors

Evidence is committed under `docs/evidence/`. It supplements the suite: the
audit runs manually before a release, the suite runs on every push.

## Negative and boundary testing

- Quantity: `0`, `-1`, `1.5`, `"3"`, above stock, inactive product, unknown
  product.
- Shipping boundary: 4999, 5000, 5001, and the post-discount case.
- Discount: valid, expired, unknown, rounding half up, 100 percent.
- Checkout: empty cart, missing field, missing idempotency key, replayed key.
- Authorization: foreign cart line, foreign order, forged token, logged out token.

## Failure evidence

- `trace: retain-on-failure`. `on-first-retry` was rejected because local runs
  have zero retries, so the trace that matters would never be recorded.
- Screenshot on failure for browser tests.
- The HTML report is uploaded as a CI artifact.

## Flake policy

- A test that fails intermittently is quarantined and investigated, not retried
  until green.
- CI retries once. A test that only passes on retry is reported as flaky in the
  summary; it is not counted as a clean pass.
- Measurement: run the suite with `--repeat-each=3` and record the failure rate
  before claiming stability.

## Browser policy

- Pull requests run the API suite and the Chromium UI suite.
- Firefox and WebKit are planned for a nightly and `main` matrix, not for every
  pull request.
- Rationale: three browsers on every pull request triples runtime and flake
  surface for little marginal signal on a small React app. The split is a
  decision, not a shortcut.

## Fault injection

Coverage is judged by whether the suite can fail for the right reason, not by a
test count. Three deliberate faults were driven through introduce, detect,
report, fix and verify on separate branches. Two exposed real gaps (cross-user
idempotency and the cart merge path); one was caught by an existing boundary
test. The red and green runs are linked in `docs/defects/README.md`.

The faults never reached `main`. Each pull request merged only after the green
run, and the merge commit preserves the three-step history.

## Deliberate non-goals

- No test that asserts a hard-coded visual pixel value.
- No UI test that duplicates an API validation assertion.
- No test that depends on a third party being online.
