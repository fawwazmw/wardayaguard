# Defect log

Four defects were injected deliberately to exercise the full loop: introduce,
detect, report, fix, verify. Each lives on its own branch and pull request, so
the red run, the failing assertion, the report and the fix commit stay visible.

| ID                                                         | Title                                      | Severity | Detected by         | Red run                                                                          | Green run                                                                        | PR                                                    |
| ---------------------------------------------------------- | ------------------------------------------ | -------- | ------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [WARD-DEF-001](WARD-DEF-001-cross-customer-idempotency.md) | Idempotency key leaked across customers    | Critical | New test `API-006`  | [40998891243](https://github.com/fawwazmw/wardayaguard/actions/runs/40998891243) | [40999051451](https://github.com/fawwazmw/wardayaguard/actions/runs/40999051451) | [#1](https://github.com/fawwazmw/wardayaguard/pull/1) |
| [WARD-DEF-002](WARD-DEF-002-cart-merge-stock.md)           | Cart merge bypassed the stock guard        | High     | New test `CART-006` | [40999309601](https://github.com/fawwazmw/wardayaguard/actions/runs/40999309601) | [40999445485](https://github.com/fawwazmw/wardayaguard/actions/runs/40999445485) | [#2](https://github.com/fawwazmw/wardayaguard/pull/2) |
| [WARD-DEF-003](WARD-DEF-003-shipping-threshold.md)         | Free shipping excluded the exact threshold | High     | Existing unit test  | [40999666482](https://github.com/fawwazmw/wardayaguard/actions/runs/40999666482) | [40999754390](https://github.com/fawwazmw/wardayaguard/actions/runs/40999754390) | [#3](https://github.com/fawwazmw/wardayaguard/pull/3) |
| [WARD-DEF-004](WARD-DEF-004-header-count.md)               | Cart badge counted lines, not units        | Medium   | New test `CART-007` | [41069728940](https://github.com/fawwazmw/wardayaguard/actions/runs/41069728940) | [41070478232](https://github.com/fawwazmw/wardayaguard/actions/runs/41070478232) | [#4](https://github.com/fawwazmw/wardayaguard/pull/4) |

Trace walkthrough for the last one:
[WARD-INV-001](../investigations/WARD-INV-001-header-count.md).

## Two kinds of detection

WARD-DEF-001, WARD-DEF-002 and WARD-DEF-004 are coverage gaps. The suite had no
test for a key shared across customers, none for the cart merge path, and none
for the badge after a quantity change. The faults were invisible until the new
test was written. Each test was written first and failed for the expected reason
before the fix.

WARD-DEF-003 is the opposite. The 4999/5000/5001 boundary test already existed,
so the regression turned the suite red immediately and no new test was needed.

Both outcomes are useful. The first shows how coverage grows; the second shows
that the existing guard does its job.

## Commit shape

For 001, 002 and 004:

1. `fault-injection: ...` introduces the defect.
2. `test: reproduce WARD-DEF-00n ...` adds the failing test and the report.
3. `fix: ...` corrects the code; the run goes green.

For 003:

1. `fault-injection: ...` introduces the defect and the report together.
2. `fix: ...` restores the rule; the existing test is the guard.

No fault reached `main`. Each pull request merged only after the green run, and
the merge commit preserves the three-step history.

## Honesty note

These are injected faults, not production incidents. Every report says so in
its "Test or product" section. The point is to show the detection and repair
loop on real code and real CI, not to inflate a defect count.
