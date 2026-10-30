# Demo and interview script

A three-minute walkthrough for a recruiter or hiring manager, plus the CV lines
and the questions this project is built to survive.

## One-liner

WardayaGuard is a regression suite for a seeded e-commerce stack: 92 tests
across API, UI and pricing, four documented defect lifecycles, and a public
Playwright report.

## CV and LinkedIn lines

Use these as written; every number is measured and linked.

- Automated 92 tests (52 API, 27 UI, 13 unit) for a React, Express and SQLite
  e-commerce stack with Playwright, Vitest and TypeScript.
- Found and closed four defects through an introduce, detect, report, fix and
  regression loop, including a Critical cross-customer idempotency leak.
- Kept pull-request CI on the API and Chromium suites, moved Firefox and WebKit
  to a nightly matrix, and measured 0 flakes across 237 repeated executions.
- Published a public Playwright report, a Docker image built and smoke-tested in
  CI, and an axe-core WCAG A/AA scan with zero violations.

Do not add "improved coverage by 80 percent" or similar. There is no baseline to
compare against, and the honest numbers are stronger.

## Three-minute walkthrough

### 0:00 to 0:20, the report

Open https://fawwazmw.github.io/wardayaguard/.

Say: "This is the latest report from the Chromium and API run. The suite is 79
Playwright tests plus 13 unit tests. The nightly matrix runs the same UI tests on
Firefox and WebKit."

Do not open traces here: the report is green, so there are none.

### 0:20 to 1:00, the README and the checklist

Open the repository. Point at the badges, the test table and the release
checklist.

Say: "Eleven of twelve release checks pass. The twelfth is the hosted demo, and
I left it partial because it needs my own hosting account, not because the code
is missing."

That sentence does more than a perfect checklist, because it shows you audit your
own claims.

### 1:00 to 2:00, the defect that matters

Open pull request #1, WARD-DEF-001.

Say: "The unique constraint on idempotency keys is per user. The lookup was not.
Two customers reusing a key would resolve to the first customer's order, with
their items, totals and address."

Show the three commits:

1. `fault-injection:` introduces it.
2. `test: reproduce` adds API-006 and the report; the run goes red.
3. `fix:` scopes the query; the run goes green.

Say: "I wrote the test first and confirmed it failed for the expected reason.
The red and green runs are both linked from the defect log."

### 2:00 to 2:40, the trace investigation

Open `docs/investigations/WARD-INV-001-header-count.md`.

Say: "This one is UI-only. The badge showed 1 for a line with quantity 3. The
trace showed a 200 with quantity 3, and the page rendered the right line total.
So the API and the cart state were correct, and the wrong value was a derived
aggregate: line count instead of unit count."

Show the screenshot: quantity 3, subtotal $87.00, badge 1.

Say: "Every earlier badge assertion used one unit, where both formulas agree.
The new test uses one line with three units, which is the smallest input that
separates them."

### 2:40 to 3:00, close

Say: "What I would do next is host the Render blueprint, add a dependency-failure
test for checkout, and keep the nightly matrix running. The flake number covers
one worker and one machine, so I would not claim more than that."

## Questions to expect

**You wrote the app and the bugs. How is that credible?**
The app is a fixture, and the defects are labelled fault injection. What is being
demonstrated is the detection and repair loop on real code and real CI, including
one Critical security case and one trace-based UI investigation. I do not present
them as production incidents.

**Why SQLite instead of Postgres?**
Zero setup, deterministic seeds and fast CI, which matters more for a fixture
than production fidelity. The trade-off is documented: one process serializes
writes, so the oversell test proves the guarded stock update, not distributed
locking. A production version would use Postgres and two API instances.

**Why not run three browsers on every pull request?**
Runtime and flake surface triple for little marginal signal on a small React app.
Pull requests get API plus Chromium; the nightly matrix gets all three. That is a
documented decision, not a shortcut.

**Why only one worker?**
The reset endpoint is global and SQLite writes are serialized. Per-worker
databases are the next step. The suite is 92 tests and runs in about 20 seconds,
so the constraint is acceptable for now.

**How did you find the idempotency bug?**
By asking what the key is scoped to. The schema says per user, the lookup said
global. Writing a test with two customers on one key was enough.

**What did the trace prove?**
That a healthy network and a wrong screen can coexist. The request returned
quantity 3 and the page rendered it. The only wrong value was a derived badge,
which narrowed the search to one aggregate in one component.

**What is not covered?**
Checkout recovery when a dependency fails, real payments, tax, rate limiting, and
durable data on the hosted demo. The checklist lists these instead of implying
full coverage.

**What would you test next?**
A fault switch for checkout dependency failure, per-worker databases, and a
second API instance against one database to test real concurrency instead of
single-process serialization.
