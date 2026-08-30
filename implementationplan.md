Phase 2: ASHA Field Workflow & Offline Sync
This plan details the implementation of the offline-first React Native mobile application for ASHA workers and the corresponding backend sync API to safely persist data to PostgreSQL.

User Review Required
IMPORTANT

Please review the SQLite table schema and Prisma schema extensions to ensure the captured Vitals and Symptoms fields align with the expected medical triage requirements.

Also review the proposed idempotency design (Client-side UUIDs) to ensure the duplicate prevention logic meets your expectations.

Open Questions
WARNING

For Expo initialization, we will use the default blank TypeScript template. Are there any specific UI component libraries you prefer (e.g., NativeBase, React Native Paper) or should we stick to standard React Native StyleSheet for a custom look?
Should the Mobile App also support PATIENT role logins (e.g. just to view their own profile), or is this strictly restricted to ASHA for Phase 2?
Proposed Changes
Backend Components
We will expand the modular monolith to support the offline sync flow.

[MODIFY] apps/backend/prisma/schema.prisma
Add models to support field data capture and idempotency:

Visit (Links PatientProfile, Facility, and User as the ASHA worker).
Vitals (temperature, bloodPressure, heartRate, SpO2, respiratoryRate, weight).
Symptom (symptom name, severity, duration, notes).
SyncLog (Stores clientSyncId to reject duplicate or retried requests).
[NEW] apps/backend/src/modules/sync/sync.routes.ts
POST /api/sync/push: Endpoint to receive batched sync payloads from the mobile device.
[NEW] apps/backend/src/modules/sync/sync.controller.ts
Zod validation for complex batched payloads.
Idempotency Logic: Begins a transaction, checks if clientSyncId exists in SyncLog. If it does, returns success without duplicating data. If it doesn't, creates the Visit, Vitals, Symptom, and inserts the clientSyncId into SyncLog, then commits.
[NEW] apps/backend/src/tests/sync.test.ts
Integration tests simulating the offline queue: testing successful sync, invalid payloads, missing authorization, and testing the duplicate (retry) prevention.
Mobile App (React Native + Expo)
Initialize a clean Expo project in apps/mobile.

Folder Structure
text

apps/mobile/
 ├─ src/
 │   ├─ api/         # Axios configuration and API calls
 │   ├─ components/  # Shared UI elements (Buttons, SyncBadge, etc.)
 │   ├─ db/          # Expo SQLite initialization and local queries
 │   ├─ navigation/  # React Navigation stack
 │   ├─ screens/     # Login, Dashboard, PatientSearch, PatientRegistration, CaptureVitals
 │   ├─ store/       # Zustand state management (Auth state, Sync state)
 │   └─ sync/        # Sync Queue manager, NetInfo listeners
[NEW] SQLite Schema & Sync Queue (apps/mobile/src/db/)
We will create local SQLite tables:

patients (read-only cache for offline search + newly created offline patients).
sync_queue: The core of the offline architecture.
id (Client UUID)
operation (e.g., CREATE_VISIT, REGISTER_PATIENT)
payload (JSON stringified data)
status (PENDING, SYNCING, FAILED)
retry_count
error_message
[NEW] Sync Engine (apps/mobile/src/sync/)
Uses @react-native-community/netinfo to detect connectivity changes.
When Online: Fetches all PENDING or FAILED items from sync_queue. Sends them sequentially or in batches to the backend. On 200 OK, deletes or marks as SYNCED in SQLite. On 500 or network failure, increments retry_count and leaves as FAILED.
When Offline: Appends new operations to sync_queue as PENDING. UI immediately reflects the pending state.
[NEW] UI Implementation
Dashboard: Shows quick stats (Pending Syncs, Today's Visits) and a SyncBadge header that changes color based on NetInfo and queue length.
Patient Search: Queries local SQLite cache first, falls back to API if online.
Capture Form: Multi-step form for Symptoms and Vitals with strict local validation (e.g. Heart Rate between 30-200) before adding to the queue.
Verification Plan
Automated Tests
Backend: Run npx jest to verify the sync controller securely and idempotently processes mocked mobile sync batches.
Mobile: Jest unit tests on the SyncEngine class simulating online/offline state transitions and verifying queue modifications.
Manual Verification (Physical Device Instructions)
Provide exact commands to run npx expo start --lan.
Document how to configure .env on the mobile device to point to your development PC's IP address.
Steps to test:
Login on the Expo Go app.
Turn on Airplane Mode.
Create a patient and capture vitals.
Verify UI says "Pending Sync (1)".
Turn off Airplane Mode.
Verify UI changes to "Synced" and data appears in PostgreSQL.