# Security Specification — MAPEV Inventory & Logistics Labels

## 1. Data Invariants
1. **Strict Ownership (`ownerId`)**: Every document in `/inventoryItems/{itemId}` and `/inventoryBatches/{batchId}` must belong exclusively to the authenticated user (`ownerId == request.auth.uid`) with a verified email (`request.auth.token.email_verified == true`).
2. **Immutable Ownership & Creation Time**: `ownerId` and `createdAt` can never be modified after document creation.
3. **Server Timestamp Enforcement**: `createdAt` (on create) and `updatedAt` (on create and update) must strictly equal `request.time`.
4. **Strict Key Allowlisting & Volumetric Bounds**: No shadow fields are permitted (`hasAll` and `hasOnly`). Every string field and ID path variable is bounded and regex-checked where applicable.
5. **Query Enforcer on List Operations**: `allow list` on `/inventoryItems` and `/inventoryBatches` strictly verifies `resource.data.ownerId == request.auth.uid`.

## 2. The "Dirty Dozen" Payloads

1. **Unauthenticated Write**: Creating an `inventoryItem` with `auth == null`.
2. **Unverified Email Spoof**: Creating an `inventoryItem` with `email_verified == false`.
3. **Identity Spoofing on Create**: Creating an `inventoryItem` where `ownerId != request.auth.uid`.
4. **Shadow Field Injection on Create**: Creating an `inventoryItem` with an undeclared field `"isAdmin": true`.
5. **Client Timestamp Forgery on Create**: Creating an `inventoryItem` where `createdAt != request.time`.
6. **Oversized String Resource Poisoning**: Creating an `inventoryItem` with a `pedido` string of 5,000 characters (`> 100`).
7. **ID Path Poisoning**: Creating an `inventoryItem` at `/inventoryItems/invalid$id!@#` failing `^[a-zA-Z0-9_\-]+$`.
8. **Ownership Hijack on Update**: Updating `ownerId` of an existing `inventoryItem` to another user's UID.
9. **Immortal Field Mutation**: Updating `createdAt` of an existing `inventoryItem`.
10. **Shadow Field Injection on Update**: Updating an `inventoryItem` with an extra key `"hacked": 1`.
11. **Cross-Tenant Read/List Scraping**: Querying `/inventoryItems` or `/inventoryBatches` belonging to another `ownerId`.
12. **Invalid Enum Value on Batch**: Creating an `inventoryBatch` where `supplier` is `"INVALID_SUPPLIER"` instead of `"LEROY MERLIN"` or `"TELHANORTE"`.
