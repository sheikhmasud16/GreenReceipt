# Security Specification for Smart Business Manager

## 1. Data Invariants
- Each registered business owner owns all sub-resources under `/users/{userId}`.
- Subcollections include: `products`, `receipts`, `purchases`, `customers`, `suppliers`, `expenses`, `inventoryTransactions`, and `payments`.
- Cross-tenant access is strictly denied: user A (`request.auth.uid != userId`) can never read or write user B's documents or sub-resources.
- Unauthenticated requests (`request.auth == null`) are completely blocked.
- Root collection `/users/{userId}` stores business profile and configuration. Only the matching `request.auth.uid` can access.

## 2. The "Dirty Dozen" Threat Payloads
1. Cross-Tenant Read: User A queries `/users/{userB_uid}/receipts` -> Denied.
2. Cross-Tenant Write: User A writes to `/users/{userB_uid}/products` -> Denied.
3. Unauthenticated Read: Anonymous query to `/users/{uid}/customers` -> Denied.
4. Path Variable Poisoning: Using a 2KB junk character string for document ID -> Denied.
5. Injected Ghost Fields: Arbitrary admin escalation flags in user document -> Denied.
6. Negative Stock Overwrite: Malicious update bypassing validation -> Denied.
7. Subcollection Tampering: Forging financial payment records into another user's store -> Denied.
8. Deleting Another User's Receipts -> Denied.
9. Modifying Another User's Expenses -> Denied.
10. Impersonating Business Identity: Changing another user's business profile -> Denied.
11. Blanket Read Attack: Reading all businesses' customers -> Denied.
12. Mass Batch Deletion across tenants -> Denied.
