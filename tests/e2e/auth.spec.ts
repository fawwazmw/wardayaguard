import { TEST_USERS } from '../fixtures/test-users';
import { expect, test } from '../support/app-fixtures';

test.describe('authentication', () => {
  test('AUTH-001 signing in shows the account and unlocks orders', async ({
    page,
    login,
    header,
  }) => {
    await login.open();
    await login.signIn(TEST_USERS.standard.email, TEST_USERS.standard.password);

    await expect(page).toHaveURL('/');
    await header.expectSignedInAs(TEST_USERS.standard.name);
    await expect(page.getByRole('link', { name: 'Orders' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' })).toHaveCount(0);
  });

  test('AUTH-002 a wrong password shows the same safe error and keeps the form', async ({
    page,
    login,
  }) => {
    await login.open();
    await login.signIn(TEST_USERS.standard.email, 'not-the-password');

    await expect(page).toHaveURL(/\/login/);
    await login.expectError('Email or password is incorrect');
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
  });

  test('AUTH-003 empty credentials are rejected before any request', async ({ login }) => {
    await login.open();
    await login.signIn('', '');

    await login.expectError('Enter your email and password.');
  });

  test('AUTH-004 protected order history redirects to login and returns after sign in', async ({
    page,
    login,
  }) => {
    await page.goto('/orders');
    await expect(page).toHaveURL(/\/login\?next=%2Forders/);

    await login.signIn(TEST_USERS.standard.email, TEST_USERS.standard.password);

    await expect(page).toHaveURL('/orders');
    await expect(page.getByRole('heading', { name: 'Orders', exact: true })).toBeVisible();
  });

  test('AUTH-005 sign out clears the session and protects order history again', async ({
    page,
    header,
    signInAs,
  }) => {
    await signInAs(TEST_USERS.standard);
    await header.signOut();

    await page.goto('/orders');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: 'Sign out' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Sign in', exact: true })).toBeVisible();
  });
});
