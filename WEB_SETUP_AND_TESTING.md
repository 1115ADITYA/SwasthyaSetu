# SwasthyaSetu Web Application — Setup & Testing Guide

## Overview

This guide covers setting up the SwasthyaSetu web application locally against the existing Node.js backend and PostgreSQL database.

**Target users:** Doctor (`DOCTOR` role), District Admin (`ADMIN` role)  
**Not for:** ASHA workers or patients (use the mobile app — Phase 2)

---

## 1. Prerequisites

- **Git** installed
- **Node.js v18+** installed
- **Docker Desktop** installed and **running** before you start

---

## 2. Repository Setup

```bat
git clone <repository_url>
cd SwasthyaSetu
git checkout claude-aditya-web
npm install
```

---

## 3. Environment Configuration

### Backend — `apps\backend\.env`

Create the file (copy from `.env.example` at the root):

```env
# Database — matches docker-compose.yml port 5433 mapped to container 5432
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/swasthyasetu?schema=public"

# Auth
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV="development"
```

> **Important:** The database runs on host port **5433** (as configured in `docker-compose.yml`). Do not use 5432.

### Web — `apps\web\.env` (optional)

The web frontend defaults to `http://localhost:3000`. Only create this file if you need to override:

```env
VITE_API_URL=http://localhost:3000
```

> **Confirmed from source:** The web app reads `import.meta.env.VITE_API_URL` — use exactly this key name.

---

## 4. Start PostgreSQL via Docker

```bat
docker-compose up -d
```

Verify it's running:
```bat
docker ps
```

You should see `swasthyasetu-db-1` on port `5433`.

---

## 5. Run Prisma Migrations

This project uses **Prisma ORM 5.22.0** with a `migrations/` folder, so the correct workflow is `migrate deploy` (not `db push`).

> **Important for Windows:** If `npx prisma` resolves to the Prisma Developer Platform CLI instead of the ORM, use the local binary directly:

```bat
cd apps\backend
.\node_modules\.bin\prisma.cmd generate
.\node_modules\.bin\prisma.cmd migrate deploy
```

- `generate` — regenerates the Prisma Client from `schema.prisma`
- `migrate deploy` — applies any pending migrations from `prisma/migrations/` to the database

> Do **not** use `db push` in conjunction with the migrations folder — this project uses migration files. `db push` is for prototyping only and can conflict with the migration history.

To inspect the database via a web UI:
```bat
.\node_modules\.bin\prisma.cmd studio
```

---

## 6. Start Services

Open two terminal windows:

**Terminal 1 — Backend:**
```bat
npm run dev:backend
```
Expected output: `SwasthyaSetu backend running on port 3000`

**Terminal 2 — Web:**
```bat
npm run dev:web
```
Expected output: `Local: http://localhost:5173/`

---

## 7. Create Test Users

The database starts empty. Use the API to register users before logging in.

### Valid Role Values (from Prisma enum)

| Role | Description |
|------|-------------|
| `PATIENT` | Patient (mobile app only — blocked on web dashboard) |
| `ASHA` | ASHA field worker (mobile app only — blocked on web dashboard) |
| `DOCTOR` | PHC Doctor — can use the web dashboard |
| `ADMIN` | District Health Officer — can use the web dashboard |

### Register a Doctor

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\": \"9876543210\", \"password\": \"securepassword123\", \"role\": \"DOCTOR\"}"
```

### Register an Admin

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\": \"9876543211\", \"password\": \"securepassword123\", \"role\": \"ADMIN\"}"
```

> **Note:** Login is rate-limited to 5 attempts per 15 minutes per IP.

---

## 8. API Endpoints Reference

All endpoints require `Authorization: Bearer <token>` except `/api/auth/*`.

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/patients` | ASHA, DOCTOR, ADMIN | List all patients (includes facility) |
| POST | `/api/patients` | ASHA, DOCTOR, ADMIN | Create patient profile |
| GET | `/api/patients/search?q=` | ASHA, DOCTOR, ADMIN | Search by name or ABHA ID |
| GET | `/api/patients/:id` | ASHA, DOCTOR, ADMIN | Get single patient with facility |
| PUT | `/api/patients/:id` | ASHA, DOCTOR, ADMIN | Update patient profile |
| GET | `/api/facilities` | ASHA, DOCTOR, ADMIN | List all facilities |
| GET | `/api/stats` | DOCTOR, ADMIN | Dashboard stats (counts, per-facility breakdown) |
| GET | `/health` | Public | Health check |

---

## 9. Manual E2E Testing

### Doctor Workflow

1. Go to `http://localhost:5173`
2. Login with phone `9876543210`, password `securepassword123`
3. **Dashboard** loads — shows real patient count and facility breakdown from PostgreSQL
4. **Patients** tab — lists all patients from the database with facility names
5. **Search** — type a name or ABHA ID, results come from `GET /api/patients/search`
6. **Patient Details** — click any patient; page fetches full details independently via `GET /api/patients/:id`
7. **Health Visits** tab — shows Phase 2 notice (Visit model not yet in DB)
8. **Sign Out** — clears JWT, returns to login

### Admin Workflow

Same as Doctor. The dashboard subtitle changes to district-level language based on role.

### Blocked Roles

Login with `PATIENT` or `ASHA` role → web dashboard shows "Access Restricted" screen directing user to mobile app.

---

## 10. Troubleshooting

| Problem | Solution |
|---------|----------|
| "Failed to fetch" on login | Ensure `npm run dev:backend` is running |
| 401 on API calls | Token expired or missing — log out and log back in |
| 403 on `/api/stats` | User is `ASHA` or `PATIENT` role — use `DOCTOR` or `ADMIN` |
| Database connection error | Ensure Docker is running: `docker ps` shows `swasthyasetu-db-1` on port 5433 |
| `prisma` command opens wrong CLI | Use `.\node_modules\.bin\prisma.cmd` from `apps\backend\` |
| Rate limit hit | Wait 15 minutes, or restart the backend server for dev purposes |

---

## 11. Phase 2 Gaps (Genuine — Not Bugs)

The following features are **planned but not yet implemented** in the backend database schema:

| Feature | Status |
|---------|--------|
| Health Visit records | Phase 2 — requires `Visit`, `Vitals`, `Symptom`, `SyncLog` Prisma models |
| ASHA offline sync (`POST /api/sync/push`) | Phase 2 — requires sync module + mobile app source code |
| Referral tracking | Phase 2 — requires `Referral` model |
| Consultation notes | Phase 2 — requires `Consultation` or Visit notes field |

These features are described in `implementationplan.md` at the repository root.
