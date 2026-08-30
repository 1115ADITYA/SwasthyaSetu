# SwasthyaSetu — Integrated Rural Healthcare Access Platform

**SIH 2026 | Problem Statement ID: SIH26133**
**Theme:** MedTech / BioTech / HealthTech
**Organization:** Government of Maharashtra — Maharashtra State Innovation Society

---

## 1. Problem Statement

Rural and underserved communities in Maharashtra face long travel distances to reach specialists, irregular diagnostic access, and fragmented medical records as patients move between sub-centres, PHCs, rural hospitals, and district hospitals. There is no continuity of information across these levels, referrals get delayed or lost, and frontline workers (ASHA/ANM) lack digital tools to track high-risk patients. Poor connectivity, low health literacy, and language barriers compound the problem. The goal is to strengthen — not replace — the existing public health system by making it more connected, visible, and accountable.

---

## 2. Our Proposed Solution

**One-line pitch:** A single connected platform that links patients, ASHA workers, PHC doctors, and district health officers with one continuous patient record — working even without internet.

SwasthyaSetu is an integrated care-access platform that digitizes the patient journey from the village sub-centre to the district hospital. ASHA/ANM workers capture patient data and vitals offline during home visits; this syncs to a longitudinal health record the moment connectivity returns. Patients get assisted teleconsultation and appointment booking via app or SMS/IVR, referrals are tracked end-to-end so no case is lost between facilities, and district officers get a live dashboard of facility load, medicine stock, and high-risk patient follow-up — all built on interoperable, government health-data standards.

---

## 3. Key Features

- Digital triage and symptom checker with multilingual (Marathi/Hindi/English) voice and text support
- Assisted teleconsultation — ASHA worker helps the patient connect to a PHC doctor via video/audio
- Appointment and queue management to cut wait times at PHCs and rural hospitals
- Longitudinal patient health record shared across sub-centre, PHC, rural hospital, and district hospital
- Referral tracking with status visibility (initiated → in-transit → completed) so referrals don't silently drop
- High-risk patient follow-up (maternal, child, chronic disease) with automated reminders
- Real-time medicine and diagnostic availability visibility per facility
- SMS/IVR fallback channel for appointment booking and reminders in zero-smartphone or no-data areas
- Facility-level and district-level quality/monitoring dashboards for health officers

---

## 4. Target Users / Beneficiaries

- **Rural patients** — especially maternal, child health, and chronic disease patients needing continuity of care
- **ASHA/ANM frontline workers** — for home visits, data capture, and assisted teleconsultation
- **PHC / Rural Hospital doctors** — for teleconsultation, triage review, and referral management
- **District Health Officers** — for facility monitoring, quality tracking, and resource allocation
- **Pharmacists / diagnostic centre staff** — for stock and test availability updates
- **State health department (Maharashtra)** — for aggregated, anonymized policy-level insights

---

## 5. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **Frontend (Patient/ASHA app)** | React Native / Flutter (offline-first mobile app) | Cross-platform, works on low-end Android devices common in rural areas |
| **Frontend (Doctor/Admin dashboard)** | React + Tailwind CSS | Fast to build, responsive, familiar to judges |
| **Backend** | Node.js (NestJS/Express) microservices | Lightweight, easy to scale horizontally |
| **Database** | PostgreSQL (structured records) + Redis (caching/queues) | Reliable relational data with fast sync queues |
| **Offline sync** | Local SQLite on device + conflict-resolved sync layer | Core requirement given rural connectivity gaps |
| **AI/ML** | Lightweight on-device/edge symptom-triage model + cloud NLP for multilingual chat | Keeps triage usable even with poor connectivity |
| **SMS/IVR** | Integration with telecom SMS gateway / IVR provider | Fallback for non-smartphone users |
| **Interoperability** | FHIR-based APIs, alignment with Ayushman Bharat Digital Mission (ABDM) health ID | Ensures records are portable and standards-compliant |
| **Hosting** | Cloud (state data centre / empanelled cloud, per govt policy) | Data residency and compliance |

---

## 6. Expected Impact / Outcomes

- Reduced patient travel and waiting time through better appointment/queue management
- Earlier consultations via assisted teleconsultation, catching issues before they escalate
- Higher referral completion rate through active tracking instead of manual follow-up
- Improved follow-up compliance for maternal, child, and chronic-condition patients
- Better visibility into medicine and diagnostic availability, reducing wasted trips
- Stronger quality monitoring and accountability at the district and state level
- A foundation that strengthens the existing public health workforce rather than bypassing it

---

## 7. Feasibility

- Uses a **modular architecture** — a working prototype can demonstrate one end-to-end flow (e.g., ASHA visit → triage → teleconsultation → referral) within a hackathon timeframe without needing every module fully built
- **Offline-first mobile + sync** is a well-understood pattern (local DB + queued sync) — no exotic infrastructure required
- **SMS/IVR fallback** can be simulated/mocked for demo purposes using standard gateway APIs
- **FHIR/ABDM alignment** can be scoped as an interface-level design commitment in the prototype, with a mocked integration for demo, avoiding real-world onboarding delays
- Built entirely on mainstream, well-documented open-source technologies (React, Node.js, PostgreSQL) — no dependency on unproven tech
- Directly reuses the existing public health hierarchy (ASHA → PHC → District Hospital) instead of inventing new processes, making it realistic and easy to explain to non-technical judges
