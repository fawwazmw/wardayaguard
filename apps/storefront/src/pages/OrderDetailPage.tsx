import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../api';
import { ErrorBanner, Loading } from '../components/States';
import { formatMoney } from '../format';
import type { Order } from '../types';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const placed = searchParams.get('placed') === '1';

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let cancelled = false;
    apiRequest<Order>(`/orders/${id}`)
      .then((result) => {
        if (!cancelled) setOrder(result);
      })
      .catch(() => {
        if (!cancelled) setError('This order could not be loaded.');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (placed && order) headingRef.current?.focus();
  }, [placed, order]);

  if (error) return <ErrorBanner message={error} />;
  if (!order) return <Loading label="Loading order..." />;

  return (
    <section className="narrow">
      <h1 ref={headingRef} tabIndex={-1} data-testid="order-heading">
        {placed ? 'Order confirmed' : `Order #${order.id}`}
      </h1>
      <p className="muted order-meta">
        Order #{order.id}. Status: {order.status}.
      </p>

      <ul className="lines">
        {order.items.map((item) => (
          <li className="line" key={item.productId}>
            <div className="line-main">
              <h2>{item.name}</h2>
              <p className="muted small">
                {formatMoney(item.unitPriceCents)} each, quantity {item.quantity}
              </p>
            </div>
            <p className="price">{formatMoney(item.lineTotalCents)}</p>
          </li>
        ))}
      </ul>

      <dl className="totals">
        <div>
          <dt>Subtotal</dt>
          <dd>{formatMoney(order.subtotalCents)}</dd>
        </div>
        {order.discountCents > 0 && (
          <div>
            <dt>Discount {order.discountCode ? `(${order.discountCode})` : ''}</dt>
            <dd>-{formatMoney(order.discountCents)}</dd>
          </div>
        )}
        <div>
          <dt>Shipping</dt>
          <dd data-testid="order-shipping">
            {order.shippingCents === 0 ? 'Free' : formatMoney(order.shippingCents)}
          </dd>
        </div>
        <div className="grand">
          <dt>Total</dt>
          <dd data-testid="order-total">{formatMoney(order.totalCents)}</dd>
        </div>
      </dl>

      <div className="address">
        <h2>Shipping to</h2>
        <p>{order.shipping.name}</p>
        <p className="muted">
          {order.shipping.address}, {order.shipping.city} {order.shipping.postalCode},{' '}
          {order.shipping.country}
        </p>
      </div>

      <p>
        <Link to="/orders">View all orders</Link>
      </p>
    </section>
  );
}
