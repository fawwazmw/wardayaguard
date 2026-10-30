import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { formatMoney } from '../format';
import type { Product } from '../types';

function stockLabel(product: Product): string {
  if (!product.active) return 'Unavailable';
  if (product.stock === 0) return 'Sold out';
  return `In stock: ${product.stock}`;
}

export function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (product: Product) => Promise<void>;
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  async function handleAdd(): Promise<void> {
    setBusy(true);
    try {
      await onAdd(product);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="card" data-testid="product-card">
      <h2>{product.name}</h2>
      <p className="muted small">{product.description}</p>
      <p className="price">{formatMoney(product.priceCents)}</p>
      <p className="muted small">{stockLabel(product)}</p>

      {!product.available ? (
        <button type="button" disabled>
          {product.active ? 'Sold out' : 'Unavailable'}
        </button>
      ) : !user ? (
        <Link to={`/login?next=${encodeURIComponent('/')}`} className="button secondary">
          Sign in to buy
        </Link>
      ) : (
        <button type="button" onClick={() => void handleAdd()} disabled={busy}>
          {busy ? 'Adding...' : 'Add to cart'}
        </button>
      )}
    </article>
  );
}
