import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, apiRequest } from '../api';
import { useCart } from '../cart';
import { EmptyState, ErrorBanner, Loading } from '../components/States';
import { formatMoney } from '../format';
import type { Order } from '../types';

interface Fields {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  discountCode: string;
}

const EMPTY_FIELDS: Fields = {
  name: '',
  address: '',
  city: '',
  postalCode: '',
  country: '',
  discountCode: '',
};

const REQUIRED_FIELDS: Array<{ key: keyof Fields; label: string }> = [
  { key: 'name', label: 'Full name' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'postalCode', label: 'Postal code' },
  { key: 'country', label: 'Country' },
];

export function CheckoutPage() {
  const { cart, loaded, refresh } = useCart();
  const navigate = useNavigate();

  // One key per checkout attempt. A retry after a network failure reuses it,
  // so the backend returns the original order instead of creating a second one.
  const idempotencyKey = useRef(crypto.randomUUID());

  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function setField(key: keyof Fields, value: string): void {
    setFields((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);

    for (const field of REQUIRED_FIELDS) {
      if (!fields[field.key].trim()) {
        setError(`${field.label} is required.`);
        return;
      }
    }

    if (fields.country.trim().length < 2) {
      setError('Country must be at least 2 characters.');
      return;
    }

    setBusy(true);
    try {
      const order = await apiRequest<Order>('/orders/checkout', {
        method: 'POST',
        headers: { 'idempotency-key': idempotencyKey.current },
        body: {
          name: fields.name.trim(),
          address: fields.address.trim(),
          city: fields.city.trim(),
          postalCode: fields.postalCode.trim(),
          country: fields.country.trim(),
          discountCode: fields.discountCode.trim() || undefined,
        },
      });
      await refresh().catch(() => undefined);
      navigate(`/orders/${order.id}?placed=1`);
    } catch (cause) {
      if (cause instanceof ApiError) {
        const detailText = cause.details?.map((detail) => detail.message).join(' ');
        setError(detailText || cause.message);
      } else {
        setError('The order could not be placed.');
      }
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return <Loading label="Loading your cart..." />;

  if (cart.items.length === 0) {
    return (
      <EmptyState title="Your cart is empty">
        <p className="muted">A checkout needs at least one item.</p>
        <Link className="button" to="/">
          Browse products
        </Link>
      </EmptyState>
    );
  }

  return (
    <section>
      <p className="kicker">Your order</p>
      <h1>Checkout</h1>

      {error && <ErrorBanner message={error} />}

      <div className="checkout">
        <div>
          <h2>Shipping details</h2>
          <form className="form" onSubmit={(event) => void handleSubmit(event)} noValidate>
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                name="name"
                autoComplete="name"
                value={fields.name}
                onChange={(event) => setField('name', event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="address">Address</label>
              <input
                id="address"
                name="address"
                autoComplete="street-address"
                value={fields.address}
                onChange={(event) => setField('address', event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="city">City</label>
              <input
                id="city"
                name="city"
                autoComplete="address-level2"
                value={fields.city}
                onChange={(event) => setField('city', event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="postalCode">Postal code</label>
              <input
                id="postalCode"
                name="postalCode"
                autoComplete="postal-code"
                value={fields.postalCode}
                onChange={(event) => setField('postalCode', event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="country">Country</label>
              <input
                id="country"
                name="country"
                autoComplete="country-name"
                value={fields.country}
                onChange={(event) => setField('country', event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="discountCode">Discount code (optional)</label>
              <input
                id="discountCode"
                name="discountCode"
                value={fields.discountCode}
                onChange={(event) => setField('discountCode', event.target.value)}
              />
              <p className="muted small">Try SAVE10 or SAVE25.</p>
            </div>

            <button type="submit" disabled={busy}>
              {busy ? 'Placing order...' : 'Place order'}
            </button>
          </form>
        </div>

        <aside className="summary" aria-label="Order summary">
          <h2>Order summary</h2>
          <ul className="summary-items">
            {cart.items.map((item) => (
              <li key={item.id}>
                <span>
                  {item.name} x {item.quantity}
                </span>
                <span>{formatMoney(item.lineTotalCents)}</span>
              </li>
            ))}
          </ul>
          <p className="summary-subtotal">
            Subtotal <strong>{formatMoney(cart.subtotalCents)}</strong>
          </p>
          <p className="muted small">
            Shipping and the discount are applied when the order is placed.
          </p>
        </aside>
      </div>
    </section>
  );
}
