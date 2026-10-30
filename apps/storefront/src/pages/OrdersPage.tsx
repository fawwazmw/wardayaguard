import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api';
import { EmptyState, ErrorBanner, Loading } from '../components/States';
import { formatDate, formatMoney } from '../format';
import type { OrderList } from '../types';

export function OrdersPage() {
  const [orders, setOrders] = useState<OrderList | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiRequest<OrderList>('/orders')
      .then((result) => {
        if (!cancelled) setOrders(result);
      })
      .catch(() => {
        if (!cancelled) setError('Your orders could not be loaded.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <h1>Orders</h1>

      {error && <ErrorBanner message={error} />}
      {!orders && !error && <Loading label="Loading orders..." />}

      {orders && orders.count === 0 && (
        <EmptyState title="No orders yet">
          <p className="muted">Orders you place appear here.</p>
          <Link className="button" to="/">
            Browse products
          </Link>
        </EmptyState>
      )}

      {orders && orders.count > 0 && (
        <ul className="lines">
          {orders.items.map((order) => (
            <li className="line" data-testid="order-row" key={order.id}>
              <div className="line-main">
                <h2>Order #{order.id}</h2>
                <p className="muted small">
                  {formatDate(order.createdAt)}. {order.itemCount}{' '}
                  {order.itemCount === 1 ? 'item' : 'items'}.
                </p>
              </div>
              <p className="price">{formatMoney(order.totalCents)}</p>
              <Link to={`/orders/${order.id}`} aria-label={`View order ${order.id}`}>
                View
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
