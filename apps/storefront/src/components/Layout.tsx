import { Link, NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../auth';
import { useCart } from '../cart';

export function Layout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const { count } = useCart();

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="site-header">
        <div className="shell header-inner">
          <Link to="/" className="brand">
            Wardaya Store
          </Link>

          <nav aria-label="Main" className="nav">
            <NavLink to="/" end>
              Shop
            </NavLink>
            {user && <NavLink to="/orders">Orders</NavLink>}
            {user && (
              <NavLink to="/cart" aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}>
                Cart{' '}
                <span className="count" data-testid="cart-count">
                  {count}
                </span>
              </NavLink>
            )}
            {user ? (
              <>
                <span className="account">{user.name}</span>
                <button type="button" className="text-button" onClick={() => void signOut()}>
                  Sign out
                </button>
              </>
            ) : (
              <NavLink to="/login">Sign in</NavLink>
            )}
          </nav>
        </div>
      </header>

      <main id="main" className="shell main">
        {children}
      </main>

      <footer className="site-footer">
        <div className="shell">
          <p>Wardaya Store is a test fixture for the WardayaGuard suite. Orders are not real.</p>
        </div>
      </footer>
    </>
  );
}
