# SwasthyaSetu External Services & APIs Audit

Based on the Product Requirements Document (`README (1).md`), the `ARCHITECTURE.md`, and the existing `.env.example` configurations, the following is a comprehensive audit of all external services and APIs required for the final product. 

---

## 1. AI Chatbot (Triage & Symptom Checker)
* **Why it is required**: To provide a multilingual digital triage and symptom checker that analyzes patient inputs (Marathi/Hindi/English) and outputs risk levels/recommendations, even in low-connectivity areas (via cloud NLP).
* **Which API/service to use**: **Gemini API** or **OpenAI API** (as indicated in `.env.example`).
* **Credential Required**: Yes.
* **Environment Variable**: `GEMINI_API_KEY` or `OPENAI_API_KEY`
* **Storage Location**: Backend `apps/backend/.env`
* **Implementation Phase**: Triage/AI Integration Phase.
* **Owner**: Backend (Member 1) for integration, Web/Mobile for UI.

## 2. IVR / Voice & Speech-to-Text / Text-to-Speech
* **Why it is required**: To provide voice support for low-literacy users and to facilitate multilingual voice interaction for the symptom checker.
* **Which API/service to use**: **Google Cloud Platform (GCP) Cloud Speech-to-Text & Text-to-Speech** or **Bhashini API** (Indian Govt ecosystem).
* **Credential Required**: Yes.
* **Environment Variable**: `GOOGLE_APPLICATION_CREDENTIALS`
* **Storage Location**: Backend `apps/backend/.env` (pointing to a JSON credential file stored securely on the server, e.g., `./gcp-key.json`).
* **Implementation Phase**: Triage/AI Integration Phase.
* **Owner**: Backend (Member 1) for processing / Mobile (Member 2) for on-device capture.

## 3. SMS & IVR Fallback (Notifications)
* **Why it is required**: To provide a fallback channel for appointment booking, referral alerts, and reminders to patients who have zero-smartphone or no-data access.
* **Which API/service to use**: **Twilio** (or an Indian gateway like **Exotel / MSG91**).
* **Credential Required**: Yes.
* **Environment Variable**: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
* **Storage Location**: Backend `apps/backend/.env`
* **Implementation Phase**: Notifications Phase.
* **Owner**: Backend (Member 1).

## 4. Teleconsultation (Video / Audio Calls)
* **Why it is required**: To facilitate ASHA-assisted teleconsultations connecting patients to PHC doctors via video or audio.
* **Which API/service to use**: **Daily.co** (as indicated in `.env.example`) or **Twilio Video/WebRTC**.
* **Credential Required**: Yes.
* **Environment Variable**: `DAILY_API_KEY`
* **Storage Location**: Backend `apps/backend/.env` (for generating meeting tokens). The frontend will also need access to the room URLs dynamically.
* **Implementation Phase**: Teleconsultation Phase.
* **Owner**: Backend (Member 1) for token generation; Mobile (Member 2) and Web (Member 3) for the SDK implementation.

## 5. Authentication
* **Why it is required**: To secure access for Patients, ASHA workers, Doctors, and Admins using Role-Based Access Control (RBAC).
* **Which API/service to use**: **Custom JWT Implementation** (already implemented in Phase 1 using `bcryptjs` and `jsonwebtoken`). No external SaaS authentication (like Auth0/Firebase Auth) is strictly required right now unless OTP login via SMS is added later.
* **Credential Required**: Yes (Self-managed secret).
* **Environment Variable**: `JWT_SECRET`, `JWT_EXPIRES_IN`
* **Storage Location**: Backend `apps/backend/.env`
* **Implementation Phase**: Phase 1 (Completed).
* **Owner**: Backend (Member 1).

## 6. Database / Caching / Storage
* **Why it is required**: To store longitudinal health records, manage offline-sync queues and conflict resolution, and store attachments (e.g., diagnostic reports).
* **Which API/service to use**: 
  - **PostgreSQL** (Core structured data)
  - **Redis** (Queues and caching)
  - **AWS S3** or **MinIO** (Object storage for images/reports)
* **Credential Required**: Yes.
* **Environment Variable**: `DATABASE_URL`, `REDIS_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_BUCKET_NAME`
* **Storage Location**: Backend `apps/backend/.env`
* **Implementation Phase**: Phase 1 (PostgreSQL setup completed). Redis and S3 in later scaling phases.
* **Owner**: Backend (Member 1).

## 7. Interoperability (ABDM / FHIR)
* **Why it is required**: To align with the Ayushman Bharat Digital Mission, allowing records to be portable and associated with a patient's Health ID (ABHA).
* **Which API/service to use**: **ABDM Sandbox APIs** (Gateway and Consent Manager).
* **Credential Required**: Yes.
* **Environment Variable**: `ABDM_CLIENT_ID`, `ABDM_CLIENT_SECRET`, `ABDM_X_CM_ID`
* **Storage Location**: Backend `apps/backend/.env`
* **Implementation Phase**: Interoperability Phase (Often mocked during hackathons to avoid onboarding delays).
* **Owner**: Backend (Member 1).

## 8. Push Notifications
* **Why it is required**: To alert smartphone-equipped users (Doctors, Admins, ASHA workers) about incoming teleconsultations, urgent referrals, and appointment schedules.
* **Which API/service to use**: **Expo Push Notifications** or **Firebase Cloud Messaging (FCM)**.
* **Credential Required**: Yes.
* **Environment Variable**: `EXPO_ACCESS_TOKEN` or `FCM_SERVER_KEY`
* **Storage Location**: Backend `apps/backend/.env`
* **Implementation Phase**: Notifications Phase.
* **Owner**: Mobile (Member 2) & Backend (Member 1).

## 9. Maps / Location (Optional but implicit)
* **Why it is required**: While not strictly mandated in the PRD, geographic visibility of facility load and referral routing for district dashboards greatly benefits from a map integration.
* **Which API/service to use**: **Mapbox** or **Google Maps API**.
* **Credential Required**: Yes.
* **Environment Variable**: `VITE_MAPBOX_TOKEN` or `EXPO_PUBLIC_GOOGLE_MAPS_KEY`
* **Storage Location**: Web `apps/web/.env` and Mobile `apps/mobile/.env`. 
* **Implementation Phase**: Admin Dashboard / Analytics Phase.
* **Owner**: Web (Member 3) & Mobile (Member 2).
