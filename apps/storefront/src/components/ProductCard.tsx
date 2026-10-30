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
  index,
  onAdd,
}: {
  product: Product;
  index: number;
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
    <article className="product-row" data-testid="product-card">
      <span className="product-index" aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </span>

      <div className="product-main">
        <h2>{product.name}</h2>
        <p className="product-desc">{product.description}</p>
      </div>

      <p className="product-stock">{stockLabel(product)}</p>
      <p className="product-price">{formatMoney(product.priceCents)}</p>

      <div className="product-action">
        {!product.available ? (
          <button type="button" disabled>
            {product.active ? 'Sold out' : 'Unavailable'}
          </button>
        ) : !user ? (
          <Link to={`/login?next=${encodeURIComponent('/')}`} className="text-link">
            Sign in to buy
          </Link>
        ) : (
          <button type="button" onClick={() => void handleAdd()} disabled={busy}>
            {busy ? 'Adding...' : 'Add to cart'}
          </button>
        )}
      </div>
    </article>
  );
}
