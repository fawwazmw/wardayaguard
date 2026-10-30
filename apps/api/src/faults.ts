/**
 * Test-only fault switches.
 *
 * A switch can only be armed through /api/test/*, which is mounted when
 * ALLOW_TEST_ROUTES=1. Production leaves the flag false and the checkout path
 * behaves normally.
 */

let pendingCheckoutFailure = false;

export function armCheckoutFailure(): void {
  pendingCheckoutFailure = true;
}

export function resetFaults(): void {
  pendingCheckoutFailure = false;
}

/** Reads and clears the switch, so exactly one checkout request fails. */
export function consumeCheckoutFailure(): boolean {
  const armed = pendingCheckoutFailure;
  pendingCheckoutFailure = false;
  return armed;
}
