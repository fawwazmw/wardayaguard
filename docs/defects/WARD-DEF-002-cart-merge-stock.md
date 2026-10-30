# WARD-DEF-002: merging a cart add bypasses the stock guard

## Summary

Adding a product that is already in the cart does not re-check available stock.
The cart accepts a quantity that cannot be fulfilled, and checkout fails later
with a confusing error.

## Severity and priority

- **Severity:** High. The cart advertises stock the store cannot ship.
- **Priority:** P1.

## Environment

- Branch: `defect/WARD-DEF-002-cart-merge-stock`
- Fault commit: the commit before this report, titled
  `fault-injection: skip the stock guard when a cart line already exists`
- API: local and CI, deterministic seed reset before the test
- Test: `tests/api/cart.api.spec.ts`, `CART-006`

## Steps to reproduce

1. Sign in as `standard@wardaya.test`.
2. Add 2 x Archive Jacket (stock 2) to the cart.
3. Add 1 more Archive Jacket.
4. Read the cart.

Automated reproduction: `npx playwright test --project=api --grep "CART-006"`.

## Expected result

The second add returns `409 OUT_OF_STOCK` with `available: 2` and
`requested: 3`, and the cart line stays at 2. This is the rule in
`docs/business-rules.md`: the requested quantity, existing plus new, must not
exceed current stock.

## Actual result

The second add returns `201` and the cart line holds 3 units of a product with
stock 2.

## Evidence

- Failing CI run: recorded on the pull request for this branch.
- Failing assertion: expected `409`, received `201`.
- Trace and report: uploaded as the `playwright-report` artifact.

## Test or product

Product defect. The merge path had no stock assertion, which the existing
single-add test did not exercise. This is a coverage gap found by writing the
test first, then confirming the fault.

## Root cause

The guard was written as `if (!existing && body.quantity > product.stock)`.
On the merge path `existing` is defined, so the check was skipped even though
`requested` was already calculated.

## Fix and regression

- Fix: validate `requested` regardless of whether the line already exists.
- Regression test: `CART-006`, added with this report and failing before the fix.
- Status: fixed on the branch, merged after a green run.
