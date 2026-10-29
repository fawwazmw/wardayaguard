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

- `tests/support/fixtures.ts` exposes an auto fixture that resets the database
  before every test.
- No test depends on execution order.
- Two customers exist so authorization can be tested without creating
  accounts at runtime.
- Sessions are created by logging in, never by inserting rows directly.

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

- Pull requests run the API suite and, once the storefront lands, Chromium only.
- The full Chromium, Firefox and WebKit matrix runs nightly and on `main`.
- Rationale: three browsers on every pull request triples runtime and flake
  surface for little marginal signal on a small React app. The split is a
  decision, not a shortcut.

## Deliberate non-goals

- No test that asserts a hard-coded visual pixel value.
- No UI test that duplicates an API validation assertion.
- No test that depends on a third party being online.
