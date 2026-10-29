export interface TestUser {
  id: number;
  email: string;
  password: string;
  name: string;
}

/**
 * Test accounts created by the seed. Deliberately duplicated rather than
 * imported from the seed so a silent seed change fails a test instead of
 * silently changing the expectation.
 */
export const TEST_USERS = {
  standard: {
    id: 1,
    email: 'standard@wardaya.test',
    password: 'Passw0rd!',
    name: 'Standard User',
  },
  rival: {
    id: 2,
    email: 'rival@wardaya.test',
    password: 'Passw0rd!',
    name: 'Rival User',
  },
} as const satisfies Record<string, TestUser>;
