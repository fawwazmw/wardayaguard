import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../api';
import { useCart } from '../cart';
import { EmptyState, ErrorBanner, Loading } from '../components/States';
import { formatMoney } from '../format';
import type { CartItem } from '../types';

function CartLine({
  item,
  onUpdate,
  onRemove,
}: {
  item: CartItem;
  onUpdate: (itemId: number, quantity: number) => Promise<boolean>;
  onRemove: (itemId: number) => Promise<void>;
}) {
  const [quantity, setQuantity] = useState(item.quantity);

  useEffect(() => {
    setQuantity(item.quantity);
  }, [item.quantity]);

  async function handleUpdate(): Promise<void> {
    const saved = await onUpdate(item.id, quantity);
    if (!saved) setQuantity(item.quantity);
  }

  return (
    <li className="line" data-testid="cart-line">
      <div className="line-main">
        <h2>{item.name}</h2>
        <p className="muted small">{formatMoney(item.unitPriceCents)} each</p>
      </div>

      <div className="line-qty">
        <label htmlFor={`quantity-${item.id}`}>Quantity for {item.name}</label>
        <input
          id={`quantity-${item.id}`}
          type="number"
          inputMode="numeric"
          min={1}
          max={Math.min(99, item.stock)}
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
        />
        <button
          type="button"
          className="secondary"
          aria-label={`Update quantity for ${item.name}`}
          onClick={() => void handleUpdate()}
        >
          Update
        </button>
      </div>

      <div className="line-end">
        <p className="price" data-testid="line-total">
          {formatMoney(item.lineTotalCents)}
        </p>
        <button
          type="button"
          className="link"
          aria-label={`Remove ${item.name}`}
          onClick={() => void onRemove(item.id)}
        >
          Remove
        </button>
      </div>
    </li>
  );
}

export function CartPage() {
  const { cart, loaded, update, remove, refresh } = useCart();
  const [error, setError] = useState<string | null>(null);

  async function handleUpdate(itemId: number, quantity: number): Promise<boolean> {
    setError(null);
    try {
      await update(itemId, quantity);
      return true;
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'The quantity could not be updated.');
      await refresh().catch(() => undefined);
      return false;
    }
  }

  async function handleRemove(itemId: number): Promise<void> {
    setError(null);
    try {
      await remove(itemId);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'The item could not be removed.');
    }
  }

  return (
    <section>
      <h1>Cart</h1>

      {error && <ErrorBanner message={error} />}

      {!loaded && <Loading label="Loading your cart..." />}

      {loaded && cart.items.length === 0 && (
        <EmptyState title="Your cart is empty">
          <p className="muted">Add a product to see it here.</p>
          <Link className="button" to="/">
            Browse products
          </Link>
        </EmptyState>
      )}

      {loaded && cart.items.length > 0 && (
        <>
          <ul className="lines">
            {cart.items.map((item) => (
              <CartLine key={item.id} item={item} onUpdate={handleUpdate} onRemove={handleRemove} />
            ))}
          </ul>

          <div className="totals">
            <p>
              Subtotal{' '}
              <strong data-testid="cart-subtotal">{formatMoney(cart.subtotalCents)}</strong>
            </p>
            <p className="muted small">Shipping and discounts are calculated at checkout.</p>
          </div>

          <Link className="button" to="/checkout">
            Continue to checkout
          </Link>
        </>
      )}
    </section>
  );
}
