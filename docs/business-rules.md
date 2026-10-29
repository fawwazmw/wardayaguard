# Wardaya Store business rules

This file is the specification the suite validates. When a rule and the code
disagree, the disagreement is a defect report, not a rewritten test.

## Money

- All amounts are stored and returned as integer cents. Currency is USD.
- Prices are fixed at the time the order is created. Order items snapshot the
  unit price and product name, so a later catalogue change cannot alter history.

## Cart

- Adding a product that is already in the cart merges the quantity into the
  existing line. It never creates a second line for the same product.
- Quantity must be an integer between 1 and 99 inclusive.
  `0`, `-1`, `1.5`, `"3"` and `null` are rejected with `400 VALIDATION_ERROR`.
- The requested quantity (existing plus new) must not exceed current stock.
  Violations return `409 OUT_OF_STOCK` with `details.available` and
  `details.requested`.
- Products with `active = 0` cannot be added or checked out
  (`409 PRODUCT_UNAVAILABLE`).
- A cart does not reserve stock. Two customers can hold the same last unit
  until one of them checks out.

## Discounts

- A discount applies to the item subtotal only. It never applies to shipping.
- The rounded amount is half up to the nearest cent:
  `round(subtotal_cents * percent_off / 100)`.
- Inactive or unknown codes return `400 INVALID_DISCOUNT_CODE`.
- Codes are case insensitive (`save10` equals `SAVE10`).

## Shipping

- Free when the discounted subtotal is greater than or equal to 5000 cents
  (USD 50.00).
- Flat 599 cents otherwise.
- Because the discount is applied first, a 5500 cent order at 10 percent off
  pays shipping: the discounted subtotal is 4950.

## Order total

```
subtotal   = sum(unit_price_cents * quantity)
discount   = round(subtotal * percent_off / 100)
shipping   = discounted_subtotal >= 5000 ? 0 : 599
total      = subtotal - discount + shipping
```

Example: 2 x Halo Socks (1200 each), code SAVE10.

```
subtotal   2400
discount    240
shipping    599   (2160 < 5000)
total      2759
```

## Checkout

- Requires an `Idempotency-Key` header, 8 to 200 characters.
- Requires name, address, city, postal code and country. Every field is
  trimmed and must be non-empty.
- An empty cart returns `409 CART_EMPTY`.
- Stock is decremented inside the same transaction that creates the order. If
  any line cannot be fulfilled, the whole transaction rolls back.
- The cart is emptied only after a successful order.
- A repeated request with the same user and idempotency key returns the
  original order with HTTP 200 and `replayed: true`. HTTP 201 is reserved for
  the request that actually created the order.
- A different key creates a new order, even with an identical body.

## Authentication and authorization

- Login returns an opaque bearer token. Tokens are stored server side and
  revoked on logout.
- Logout invalidates only the presented token. Other sessions of the same
  account stay valid.
- A wrong password and an unknown email produce the same `401` body, so the
  API does not confirm whether an account exists.
- Orders and cart lines are scoped to the authenticated user.
- Reading another customer's order returns `404 ORDER_NOT_FOUND`, not `403`.
  Returning 403 would confirm that the id exists.

## Errors

All errors use one envelope:

```json
{ "error": { "code": "OUT_OF_STOCK", "message": "Only 2 unit(s) ...", "details": {} } }
```

Server faults return `500 INTERNAL_ERROR` with a generic message. Stack traces
and internal details are logged server side only.

## Known limitations

- One SQLite process serializes writes. The oversell test proves the guarded
  `UPDATE ... WHERE stock >= ?`, not distributed locking. Running two API
  instances against one database is a future improvement.
- No tax, no payment provider, no shipping carrier integration.
- No rate limiting or account lockout.
- No password reset flow.
