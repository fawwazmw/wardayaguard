import { useEffect, useState } from 'react';
import { ApiError, apiRequest } from '../api';
import { useAuth } from '../auth';
import { useCart } from '../cart';
import { ProductCard } from '../components/ProductCard';
import { ErrorBanner, Loading } from '../components/States';
import type { Product, ProductList } from '../types';

export function CataloguePage() {
  const { user } = useAuth();
  const { add } = useCart();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name_asc');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    params.set('sort', sort);

    apiRequest<ProductList>(`/products?${params.toString()}`)
      .then((data) => {
        if (!cancelled) setProducts(data.items);
      })
      .catch(() => {
        if (!cancelled) setError('The catalogue could not be loaded.');
      });

    return () => {
      cancelled = true;
    };
  }, [search, sort, reloadKey]);

  async function handleAdd(product: Product): Promise<void> {
    setNotice(null);
    setError(null);
    try {
      await add(product.id);
      setNotice(`Added ${product.name} to cart.`);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'This item could not be added.');
    }
  }

  return (
    <section>
      <div className="page-head">
        <h1>Shop</h1>
        <p className="muted">Everyday clothing, kept deliberately small.</p>
      </div>

      <div className="toolbar">
        <div className="field">
          <label htmlFor="search">Search products</label>
          <input
            id="search"
            type="search"
            value={search}
            placeholder="Hoodie, socks, jacket"
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="sort">Sort by</label>
          <select id="sort" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="name_asc">Name, A to Z</option>
            <option value="price_asc">Price, low to high</option>
            <option value="price_desc">Price, high to low</option>
          </select>
        </div>
      </div>

      {notice && (
        <p className="notice" role="status" data-testid="catalogue-notice">
          {notice}
        </p>
      )}
      {error && <ErrorBanner message={error} onRetry={() => setReloadKey((key) => key + 1)} />}

      {products === null && !error && <Loading label="Loading products..." />}

      {products !== null && (
        <>
          <p className="muted small" role="status">
            {products.length} {products.length === 1 ? 'product' : 'products'}
          </p>

          {products.length === 0 ? (
            <div className="empty">
              <h2>No products match &quot;{search}&quot;</h2>
              <p className="muted">Try a shorter search, or clear it to see the full catalogue.</p>
              <button type="button" className="secondary" onClick={() => setSearch('')}>
                Clear search
              </button>
            </div>
          ) : (
            <div className="grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={handleAdd} />
              ))}
            </div>
          )}
        </>
      )}

      {!user && (
        <p className="muted small">Browsing is public. Sign in to keep a cart and place orders.</p>
      )}
    </section>
  );
}
