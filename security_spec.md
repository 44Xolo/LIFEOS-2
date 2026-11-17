# LIFEOS Firestore Security Specification

## 1. Data Invariants
1. **Strict Ownership Isolation**: Every document in `/users/{userId}` and all subcollections (`/private`, `/transactions`, `/goals`, `/clients`, `/documents`, `/tasks`, `/opportunities`, `/learning`) belongs exclusively to `userId` and MUST store `ownerId == request.auth.uid`.
2. **Verified Authentication**: All read/write operations require an authenticated Firebase user with `request.auth.token.email_verified == true`.
3. **PII Isolation**: User email, phone number, business name, and physical location are isolated in `/users/{userId}/private/profile` and strictly restricted to `isVerifiedOwner(userId)`.
4. **Parent Existence (Master Gate)**: Every subcollection `create` verifies `exists(/databases/$(database)/documents/users/$(userId))` so orphaned records cannot exist without an active workspace.
5. **Temporal Integrity & Immutability**: `createdAt` must equal `request.time` on `create` and remain immutable on `update`; `updatedAt` must equal `request.time` on both `create` and `update`. `ownerId` is immutable.
6. **Terminal State Locking**: Once a `BudgetGoal` or `LifeTask` or `BusinessDocument` reaches terminal state (`completed` or `paid`), core financial/identity fields cannot be silently rewritten without explicit status constraints; `paid` invoices cannot revert to `draft` or change `totalAmount`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)
1. **Unauthenticated Read**: `GET /users/uid_A/transactions/tx_1` with `auth: null`.
2. **Cross-Tenant List**: `LIST /users/uid_A/tasks` authenticated as `uid_B`.
3. **Unverified Email Write**: `CREATE /users/uid_A/transactions/tx_1` with `email_verified: false`.
4. **Owner Spoofing on Create**: `CREATE /users/uid_A/tasks/t1` with `ownerId: "uid_B"` while signed in as `uid_A`.
5. **Shadow Field Injection**: `CREATE /users/uid_A/tasks/t1` including an undeclared key `isAdmin: true`.
6. **ID Poisoning**: `CREATE /users/uid_A/tasks/invalid$id..length` or >128 char doc ID.
7. **Timestamp Forgery**: `CREATE /users/uid_A/transactions/tx_1` with a client-supplied past `createdAt` timestamp instead of `request.time`.
8. **Negative Financial Amount**: `CREATE /users/uid_A/transactions/tx_1` with `amount: -500`.
9. **String Overflow (Denial of Wallet)**: `CREATE /users/uid_A/tasks/t1` with a 5,000-character `title`.
10. **PII Cross-Read**: `GET /users/uid_A/private/profile` authenticated as `uid_B`.
11. **Partial Update Hijack**: `UPDATE /users/uid_A/documents/inv_1` attempting to mutate `ownerId` or `createdAt` or `docNumber`.
12. **Terminal Invoice Mutation**: `UPDATE /users/uid_A/documents/inv_1` where existing `status == 'paid'`, attempting to alter `totalAmount` or revert `status` to `'draft'`.
