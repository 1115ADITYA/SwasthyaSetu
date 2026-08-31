# SwasthyaSetu Project Memory

This file serves as a context handover and memory reference for the next session or chat to quickly understand the current state of the project, architectural decisions, and recent completions.

## 1. Current Branch & Code State
- **Branch:** `develop` is the active and stable integration branch.
- **Repository Structure:** Modular Monolith using Yarn/NPM workspaces.
  - `apps/backend/` - Node.js + Express + Prisma backend
  - `apps/mobile/` - React Native (Expo) - Pending
  - `apps/web/` - React + Vite - Pending
  - `packages/shared-types/` - Shared Zod schemas and TypeScript interfaces

## 2. Completed Milestones
### ✅ Phase 1: Foundation (Backend)
- Express + TypeScript backend configured with Zod for request validation.
- PostgreSQL database provisioned via `docker-compose.yml`.
- Prisma ORM (`v5.22.0`) fully integrated and migrations working properly (`npx prisma migrate dev`).
- Secure JWT Authentication and Role-Based Access Control (RBAC) implemented with roles: `PATIENT`, `ASHA`, `DOCTOR`, `ADMIN`.
- Patient registration, login, and search functionality fully tested.

### ✅ Phase 2: ASHA Field Workflow (Backend Only)
- Schema updated with `HealthVisit`, `Vitals`, `Symptom`, and `SyncReceipt` models.
- **Offline-First Sync API:** Implemented `POST /api/sync` supporting bulk payload uploads from offline mobile clients.
- **Idempotency:** Enforced via `SyncReceipt.clientSyncId` strictly rejecting duplicate sync items cleanly without throwing 500 errors.
- **Testing Standard:** Unit tests in `src/tests/` interact with the live PostgreSQL database instead of mocking Prisma, ensuring robust integration verification.

## 3. Technical Constraints & Decisions
- **Testing:** Do not use `jest.mock()` for Prisma. Ensure tests interact with the real database to properly validate foreign keys and unique constraints.
- **Jest & UUIDs:** `uuid` is downgraded to `^9.0.1` because `v10+` defaults to ESM, which breaks standard Jest CJS execution.
- **Idempotency & Client IDs:** The frontend *must* generate strict UUIDs (`clientSyncId`) for every operation performed offline. Do not accept arbitrary string formats.
- **Vitals Validation:** Vitals validation in backend checks for broad data-validity bounds (e.g., Temp: 25-45 °C, HeartRate: 20-250 bpm), rather than strict medical diagnostic thresholds.

## 4. Pending & Next Steps
- **Phase 2 (Mobile):** Build the actual ASHA React Native (Expo) app to capture Patient/Vitals/Symptoms offline (local SQLite) and push via the `/api/sync` endpoint.
- **Phase 3 (Teleconsultation):** WebRTC/Daily.co integration to allow assisted video/audio calls.
- **Phase 4 (Notifications & Fallback):** Integration with Twilio for SMS/IVR fallback.
- **Phase 5 (AI Chatbot):** Triage processing using GCP/Gemini for multilingual NLP.
- Reference the `EXTERNAL_SERVICES_AUDIT.md` for a comprehensive list of required API keys before starting integrations.
