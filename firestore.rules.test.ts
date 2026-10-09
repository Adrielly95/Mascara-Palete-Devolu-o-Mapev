/**
 * Test Suite for Firestore Security Rules ("Dirty Dozen" Verification)
 */
export interface DirtyDozenTestCase {
  id: number;
  name: string;
  collection: string;
  operation: 'create' | 'update' | 'get' | 'list' | 'delete';
  expected: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  { id: 1, name: 'Unauthenticated Write', collection: 'inventoryItems', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 2, name: 'Unverified Email Spoof', collection: 'inventoryItems', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 3, name: 'Identity Spoofing on Create', collection: 'inventoryItems', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 4, name: 'Shadow Field Injection on Create', collection: 'inventoryItems', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 5, name: 'Client Timestamp Forgery on Create', collection: 'inventoryItems', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 6, name: 'Oversized String Resource Poisoning', collection: 'inventoryItems', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 7, name: 'ID Path Poisoning', collection: 'inventoryItems', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 8, name: 'Ownership Hijack on Update', collection: 'inventoryItems', operation: 'update', expected: 'PERMISSION_DENIED' },
  { id: 9, name: 'Immortal Field Mutation', collection: 'inventoryItems', operation: 'update', expected: 'PERMISSION_DENIED' },
  { id: 10, name: 'Shadow Field Injection on Update', collection: 'inventoryItems', operation: 'update', expected: 'PERMISSION_DENIED' },
  { id: 11, name: 'Cross-Tenant Read/List Scraping', collection: 'inventoryItems', operation: 'list', expected: 'PERMISSION_DENIED' },
  { id: 12, name: 'Invalid Enum Value on Batch', collection: 'inventoryBatches', operation: 'create', expected: 'PERMISSION_DENIED' },
];
