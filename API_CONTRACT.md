# SwasthyaSetu API Contract (Phase 2)

This document describes the APIs implemented in the Backend for the ASHA mobile application (Member 2).

## 1. Create Health Visit

Used when the mobile app has internet and wants to create a visit synchronously.

* **METHOD**: `POST`
* **PATH**: `/api/visits`
* **AUTHENTICATION**: JWT Required (`Authorization: Bearer <token>`)
* **ALLOWED ROLES**: `ASHA`, `DOCTOR`

### Request Body
```json
{
  "patientId": "uuid-string",
  "status": "COMPLETED",
  "notes": "Optional notes",
  "vitals": {
    "temperature": 37.0,
    "systolic": 120,
    "diastolic": 80,
    "heartRate": 72,
    "spO2": 98,
    "respiratoryRate": 16,
    "weight": 65.5
  },
  "symptoms": [
    {
      "name": "Fever",
      "severity": "MILD",
      "durationDays": 2,
      "notes": "Started yesterday"
    }
  ]
}
```

### Response Body (201 Created)
```json
{
  "message": "Visit created successfully",
  "visitId": "uuid-string"
}
```

### Error Responses
* `401 Unauthorized`: Missing or invalid token.
* `403 Forbidden`: User role is not ASHA or DOCTOR.
* `400 Bad Request`: Validation failure (e.g. `vitals.heartRate` > 250).
* `404 Not Found`: `patientId` does not exist.

---

## 2. Get Patient Visits

Used to fetch the history of health visits for a specific patient.

* **METHOD**: `GET`
* **PATH**: `/api/visits/patient/:patientId`
* **AUTHENTICATION**: JWT Required (`Authorization: Bearer <token>`)
* **ALLOWED ROLES**: `ASHA`, `DOCTOR`

### Response Body (200 OK)
```json
{
  "visits": [
    {
      "id": "uuid",
      "patientId": "uuid",
      "status": "COMPLETED",
      "createdAt": "2026-08-30T...",
      "vitals": { ... },
      "symptoms": [ { ... } ],
      "recordedBy": {
        "id": "uuid",
        "role": "ASHA",
        "phoneNumber": "+919999999999"
      }
    }
  ]
}
```

---

## 3. Offline Sync

Used by the mobile SyncQueue to push locally created records when the device comes online.
**IMPORTANT IDEMPOTENCY RULE**: Member 2 MUST generate a unique `clientSyncId` (UUID) for EVERY offline operation. The backend guarantees that retrying the exact same `clientSyncId` will NOT create duplicate database records. It will simply return `"status": "duplicate"`, which the mobile app should treat as a success (and remove the item from the local SQLite queue).

* **METHOD**: `POST`
* **PATH**: `/api/sync`
* **AUTHENTICATION**: JWT Required (`Authorization: Bearer <token>`)
* **ALLOWED ROLES**: `ASHA`

### Request Body
```json
{
  "items": [
    {
      "clientSyncId": "uuid-string-generated-on-device",
      "operation": "CREATE_VISIT",
      "entityType": "HealthVisit",
      "entityId": "optional-uuid-string-of-local-sqlite-visit-record",
      "payload": {
        "patientId": "uuid-string",
        "status": "COMPLETED",
        "vitals": { ... },
        "symptoms": [ ... ]
      }
    }
  ]
}
```

### Response Body (200 OK)
Note: The HTTP status will be 200 even if some items fail. Inspect the `results` array to see per-item status.

```json
{
  "message": "Sync processed",
  "results": [
    {
      "clientSyncId": "uuid-1",
      "status": "success",
      "serverEntityId": "uuid-string"
    },
    {
      "clientSyncId": "uuid-2",
      "status": "duplicate",
      "serverEntityId": "uuid-string"
    },
    {
      "clientSyncId": "uuid-3",
      "status": "failed",
      "error": "Invalid payload for CREATE_VISIT: ..."
    }
  ]
}
```

### Error Responses
* `401 Unauthorized`: Missing or invalid token.
* `403 Forbidden`: User role is not ASHA.
* `400 Bad Request`: Entire payload is malformed (not an array of items).
