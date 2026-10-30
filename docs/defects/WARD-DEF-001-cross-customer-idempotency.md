# WARD-DEF-001: idempotency key is not scoped to the customer

## Summary

Two customers who reuse the same `Idempotency-Key` value receive the same order.
The second customer sees the first customer's items, totals and shipping
address.

## Severity and priority

- **Severity:** Critical. Cross-customer data exposure.
- **Priority:** P1.

## Environment

- Branch: `defect/WARD-DEF-001-idempotency-scope`
- Fault commit: the commit before this report, titled
  `fault-injection: resolve idempotency keys without the customer scope`
- API: local and CI, deterministic seed reset before the test
- Test: `tests/api/orders.api.spec.ts`, `API-006`

## Steps to reproduce

1. Sign in as `standard@wardaya.test` and add Halo Socks to the cart.
2. Sign in as `rival@wardaya.test` and add Lumen Tee to the cart.
3. Send both checkouts with the header `Idempotency-Key: shared-<uuid>` using
   the same value for both customers.
4. Compare the two responses.

Automated reproduction: `npx playwright test --project=api --grep "API-006"`.

## Expected result

Each checkout creates its own order: `201` twice, two different order ids, and
each order contains only that customer's line item. This matches the schema
constraint `UNIQUE (user_id, idempotency_key)` and the rule in
`docs/business-rules.md`: a key is unique per user, not globally.

## Actual result

The second checkout returns `200` with `replayed: true` and the first
customer's order id, items and shipping address.

## Evidence

- Failing CI run: [40998891243](https://github.com/fawwazmw/wardayaguard/actions/runs/40998891243)
- Failing assertion: expected `201`, received `200`.
- Trace and report: uploaded as the `playwright-report` artifact.

## Test or product

Product defect. The regression test encodes the specification; it is not a test
error. The fault was introduced deliberately to demonstrate detection, and it is
labelled as such in the commit history.

## Root cause

`ordersRouter.post('/checkout')` looked up the replay with
`WHERE idempotency_key = ?` and then loaded the order using the owner id from
that row. Because the unique constraint is per user, a key collision across
customers resolved to another customer's order.

## Fix and regression

- Fix: scope the lookup to the authenticated user,
  `WHERE user_id = ? AND idempotency_key = ?`.
- Regression test: `API-006`, added with this report and failing before the fix.
- Status: fixed on the branch, merged after a green run.
