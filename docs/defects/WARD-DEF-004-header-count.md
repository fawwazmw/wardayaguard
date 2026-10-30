# WARD-DEF-004: cart badge counts lines, not units

## Summary

With one product at quantity 3, the header cart badge shows 1. The cart page
shows the correct quantity, line total and subtotal.

## Severity and priority

- **Severity:** Medium. Misleading navigation state, no financial impact.
- **Priority:** P2.

## Environment

- Branch: `defect/WARD-DEF-004-header-count`
- Fault commit: the commit before this report, titled
  `fault-injection: derive the cart badge from line count`
- Test: `tests/e2e/cart.spec.ts`, `CART-007`
- Browser: Chromium locally, all three browsers in the nightly

## Steps to reproduce

1. Sign in as `standard@wardaya.test`.
2. Add Lumen Tee to the cart.
3. Open the cart and change the quantity to 3.
4. Read the cart badge in the header.

Automated reproduction:

```bash
npx playwright test --project=chromium --grep "CART-007"
```

## Expected result

The badge shows 3, the total number of units in the cart. This is the documented
behaviour: the badge counts items, not lines.

## Actual result

The badge shows 1. The cart line still shows quantity 3 and a line total of
$87.00, so the wrong value is isolated to the badge.

## Evidence

- Failing CI run: recorded on the pull request for this branch.
- Failing assertion: expected `"3"`, received `"1"`.
- Screenshot: [WARD-DEF-004-header-count.png](../evidence/WARD-DEF-004-header-count.png)
- Trace: `test-results/.../trace.zip` from the failing run, also uploaded as a
  CI artifact.
- Network: `PATCH /api/cart/items/1` returned `200` with
  `{"quantity":3,"lineTotalCents":8700}`.

## Test or product

Product defect. The API, the cart page and the subtotal are correct. The fault
was introduced deliberately in a derived UI value to demonstrate trace-based
localization. It is labelled as such in the commit history.

## Root cause

`CartProvider` computed the badge from `cart.items.length` instead of summing
`item.quantity`. With one line of three units, both the badge and the visual
result disagreed: the data was right, the aggregate was wrong.

## Fix and regression

- Fix: `cart.items.reduce((total, item) => total + item.quantity, 0)`.
- Regression test: `CART-007`, added with this report and failing before the fix.
- Status: fixed on the branch, merged after a green run.

## Investigation

The full trace walkthrough is in
[WARD-INV-001](../investigations/WARD-INV-001-header-count.md).
