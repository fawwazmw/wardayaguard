# Test cases

Traceability between the designed cases and the automation that proves them.
`Automated` means a test exists in this repository and passed on the last run
(2026-10-30: 13 unit, 50 API, 23 UI). `Planned` means designed but not
implemented yet.

IDs are area prefixed because the area already namespaces them. Defects use
`WARD-DEF-nnn` (see `docs/defects/`).

## A. Authentication

| ID       | Title                                                               | Priority | Layer | Status    | Spec                         |
| -------- | ------------------------------------------------------------------- | -------- | ----- | --------- | ---------------------------- |
| AUTH-001 | Valid credentials open the account                                  | P1       | API   | Automated | `tests/api/auth.api.spec.ts` |
| AUTH-001 | Valid credentials open the account page                             | P1       | UI    | Automated | `tests/e2e/auth.spec.ts`     |
| AUTH-002 | Incorrect password shows a safe error                               | P1       | API   | Automated | `tests/api/auth.api.spec.ts` |
| AUTH-002 | Incorrect password shows a safe error                               | P1       | UI    | Automated | `tests/e2e/auth.spec.ts`     |
| AUTH-003 | Empty required fields are rejected                                  | P2       | API   | Automated | `tests/api/auth.api.spec.ts` |
| AUTH-003 | Empty required fields are rejected                                  | P2       | UI    | Automated | `tests/e2e/auth.spec.ts`     |
| AUTH-004 | Unauthenticated access to protected routes is denied                | P1       | API   | Automated | `tests/api/auth.api.spec.ts` |
| AUTH-004 | Unauthenticated order history redirects, then returns after sign in | P1       | UI    | Automated | `tests/e2e/auth.spec.ts`     |
| AUTH-005 | Logout invalidates the presented session only                       | P1       | API   | Automated | `tests/api/auth.api.spec.ts` |
| AUTH-005 | Sign out clears the browser session and re-protects orders          | P1       | UI    | Automated | `tests/e2e/auth.spec.ts`     |

## B. Product catalogue

| ID       | Title                                              | Priority | Layer | Status    | Spec                             |
| -------- | -------------------------------------------------- | -------- | ----- | --------- | -------------------------------- |
| PROD-001 | Catalogue matches the documented fixture           | P1       | API   | Automated | `tests/api/products.api.spec.ts` |
| PROD-001 | Product list shows API names, prices and stock     | P1       | UI    | Automated | `tests/e2e/catalogue.spec.ts`    |
| PROD-002 | Search matches and handles no results              | P2       | API   | Automated | `tests/api/products.api.spec.ts` |
| PROD-002 | Search shows results and an empty state            | P2       | UI    | Automated | `tests/e2e/catalogue.spec.ts`    |
| PROD-003 | Price sorting works in both directions             | P2       | API   | Automated | `tests/api/products.api.spec.ts` |
| PROD-003 | Price sorting reorders the grid                    | P2       | UI    | Automated | `tests/e2e/catalogue.spec.ts`    |
| PROD-004 | Unavailable products cannot be purchased           | P1       | API   | Automated | `tests/api/cart.api.spec.ts`     |
| PROD-004 | Sold out and inactive products cannot be purchased | P1       | UI    | Automated | `tests/e2e/catalogue.spec.ts`    |
| PROD-005 | Unknown product id returns not found               | P2       | API   | Automated | `tests/api/products.api.spec.ts` |

## C. Shopping cart

| ID       | Title                                                           | Priority | Layer | Status    | Spec                         |
| -------- | --------------------------------------------------------------- | -------- | ----- | --------- | ---------------------------- |
| CART-001 | Adding a product creates a line with correct price and quantity | P1       | API   | Automated | `tests/api/cart.api.spec.ts` |
| CART-001 | Adding a product creates a line and updates the header count    | P1       | UI    | Automated | `tests/e2e/cart.spec.ts`     |
| CART-002 | Changing quantity recalculates the subtotal                     | P1       | API   | Automated | `tests/api/cart.api.spec.ts` |
| CART-002 | Changing quantity recalculates the line and subtotal            | P1       | UI    | Automated | `tests/e2e/cart.spec.ts`     |
| CART-003 | Removing an item updates the cart and total                     | P1       | API   | Automated | `tests/api/cart.api.spec.ts` |
| CART-003 | Removing the only item shows the empty state                    | P1       | UI    | Automated | `tests/e2e/cart.spec.ts`     |
| CART-004 | Invalid quantities are rejected                                 | P1       | API   | Automated | `tests/api/cart.api.spec.ts` |
| CART-005 | Quantity above stock is rejected                                | P1       | API   | Automated | `tests/api/cart.api.spec.ts` |
| CART-005 | Rejected quantity shows the error and restores the line         | P1       | UI    | Automated | `tests/e2e/cart.spec.ts`     |

## D. Checkout and orders

| ID      | Title                                                               | Priority | Layer | Status    | Spec                           |
| ------- | ------------------------------------------------------------------- | -------- | ----- | --------- | ------------------------------ |
| CHK-001 | Valid customer and shipping details pass validation                 | P1       | API   | Automated | `tests/api/orders.api.spec.ts` |
| CHK-002 | Missing required shipping details prevent checkout                  | P1       | API   | Automated | `tests/api/orders.api.spec.ts` |
| CHK-002 | Missing postal code blocks the order and keeps the form             | P1       | UI    | Automated | `tests/e2e/checkout.spec.ts`   |
| CHK-003 | Total matches subtotal, discount and shipping                       | P1       | API   | Automated | `tests/api/orders.api.spec.ts` |
| CHK-003 | Total matches subtotal, discount and shipping                       | P1       | Unit  | Automated | `tests/unit/pricing.spec.ts`   |
| CHK-003 | Confirmation shows the discounted and free-shipping totals          | P1       | UI    | Automated | `tests/e2e/checkout.spec.ts`   |
| CHK-004 | Checkout creates one order with correct line items                  | P1       | API   | Automated | `tests/api/orders.api.spec.ts` |
| CHK-004 | Confirmation and order history show the created order               | P1       | UI    | Automated | `tests/e2e/checkout.spec.ts`   |
| CHK-005 | Repeated request with the same idempotency key creates no duplicate | P1       | API   | Automated | `tests/api/orders.api.spec.ts` |

## E. API, security and reliability

| ID      | Title                                                        | Priority | Layer | Status    | Spec                           |
| ------- | ------------------------------------------------------------ | -------- | ----- | --------- | ------------------------------ |
| API-001 | Protected endpoints reject missing or invalid authentication | P1       | API   | Automated | `tests/api/auth.api.spec.ts`   |
| API-002 | A user cannot read another user's order                      | P1       | API   | Automated | `tests/api/orders.api.spec.ts` |
| API-002 | Another customer cannot open the order by id in the browser  | P1       | UI    | Automated | `tests/e2e/regression.spec.ts` |
| API-003 | Malformed bodies return controlled validation errors         | P1       | API   | Automated | `tests/api/auth.api.spec.ts`   |
| API-004 | Repeated requests do not oversell the final unit             | P1       | API   | Automated | `tests/api/orders.api.spec.ts` |
| API-005 | Server errors expose no stack trace or secret                | P1       | API   | Automated | `tests/api/health.api.spec.ts` |

## F. Regression and usability

| ID      | Title                                                         | Priority | Layer | Status    | Spec                           |
| ------- | ------------------------------------------------------------- | -------- | ----- | --------- | ------------------------------ |
| REG-001 | Full journey from login to order confirmation to history      | P1       | UI    | Automated | `tests/e2e/regression.spec.ts` |
| REG-002 | Cart persistence after refresh follows documented behaviour   | P2       | UI    | Automated | `tests/e2e/cart.spec.ts`       |
| REG-003 | Checkout recovers gracefully when a dependency is unavailable | P1       | UI    | Planned   | -                              |
| REG-004 | Core shopping journey works at mobile width                   | P2       | UI    | Automated | `tests/e2e/regression.spec.ts` |
| REG-005 | Keyboard navigation and visible focus in checkout             | P2       | UI    | Automated | `tests/e2e/regression.spec.ts` |
| REG-010 | Signed out visitors get a sign in path, not a dead add button | P2       | UI    | Automated | `tests/e2e/catalogue.spec.ts`  |

## G. Additional regression guard

| ID      | Title                                                         | Priority | Layer | Status    | Spec                           |
| ------- | ------------------------------------------------------------- | -------- | ----- | --------- | ------------------------------ |
| REG-006 | Duplicate cart lines never coexist for one product            | P2       | API   | Automated | `tests/api/cart.api.spec.ts`   |
| REG-007 | Logout does not invalidate other sessions of the same account | P2       | API   | Automated | `tests/api/auth.api.spec.ts`   |
| REG-008 | A customer only sees their own cart                           | P1       | API   | Automated | `tests/api/cart.api.spec.ts`   |
| REG-009 | Order history lists only the customer's orders                | P1       | API   | Automated | `tests/api/orders.api.spec.ts` |
| REG-011 | Expired discount code is reported and creates no order        | P1       | API   | Automated | `tests/api/orders.api.spec.ts` |
| REG-011 | Expired discount code is reported and creates no order        | P1       | UI    | Automated | `tests/e2e/checkout.spec.ts`   |

## Not yet automated

- REG-003, dependency failure during checkout. Needs a fault switch on the
  storefront or a proxy that can fail a request.
- Firefox and WebKit variants of REG-001, REG-004 and REG-005.
