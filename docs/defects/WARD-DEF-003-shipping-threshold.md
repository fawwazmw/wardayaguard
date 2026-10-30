# WARD-DEF-003: free shipping stops at exactly the threshold

## Summary

An order whose discounted subtotal is exactly 5000 cents (USD 50.00) is charged
the flat shipping fee. The rule says shipping is free at or above the threshold.

## Severity and priority

- **Severity:** High. A customer at the boundary is overcharged.
- **Priority:** P2. Only the exact boundary is affected.

## Environment

- Branch: `defect/WARD-DEF-003-shipping-threshold`
- Fault commit: the commit that carries this report, titled
  `fault-injection: charge shipping at exactly the free-shipping threshold`
- API: local and CI, deterministic seed
- Test: `tests/unit/pricing.spec.ts`, `is free exactly at the threshold`

## Steps to reproduce

1. Compute totals for a single line of 5000 cents with no discount, or call
   `shippingFor(5000)` from `apps/api/src/pricing.ts`.
2. Compare the returned shipping fee with `docs/business-rules.md`.

Automated reproduction:

```bash
npx vitest run tests/unit/pricing.spec.ts
```

## Expected result

4999 cents pays 599. 5000 cents pays 0. 5001 cents pays 0. The comparison is
inclusive, as written in `docs/business-rules.md`.

## Actual result

`shippingFor(5000)` returns 599. The order total is 5599 instead of 5000.

## Evidence

- Failing CI run: [40999666482](https://github.com/fawwazmw/wardayaguard/actions/runs/40999666482)
- Failing assertion: expected `0`, received `599` in
  `pricing specification > shipping > is free exactly at the threshold`.
- CI stopped at the unit step. The UI and API projects never ran, which is the
  intended fast failure for a pure pricing regression.

## Test or product

Product defect. Detection is entirely by the existing suite, which is the point
of this case: the regression guard already exists, so the fix needs no new test.

## Root cause

The comparison used `>` instead of `>=`. The unit suite already covered the
4999, 5000 and 5001 boundaries, so the defect could not reach a release without
turning the suite red.

## Fix and regression

- Fix: restore the inclusive comparison.
- Regression test: the existing `pricing.spec.ts` boundary case. No new test
  added, because the guard was already there.
- Status: fixed on the branch, merged after a green run.
