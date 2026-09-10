import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// API Base URL
//
// Priority order:
//   1. EXPO_PUBLIC_API_URL env var (set in .env or EAS build profile)
//   2. Platform-aware local-development fallback:
//      - Android emulator  → 10.0.2.2:3000
//      - iOS simulator / physical device → localhost:3000
//
// To override for LAN testing create apps/mobile/.env with:
//   EXPO_PUBLIC_API_URL=http://192.168.1.111:3000
// ---------------------------------------------------------------------------
const LOCAL_DEV_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

export const ENV = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL ?? LOCAL_DEV_URL,

  // ---------------------------------------------------------------------------
  // DEFAULT_FACILITY_ID
  //
  // This must be a valid UUID matching a Facility row in the database.
  // It is ONLY used as a last-resort fallback when:
  //   - The ASHA logs in offline (no server response available), AND
  //   - The PatientRegistrationScreen field is left empty.
  //
  // Set EXPO_PUBLIC_DEFAULT_FACILITY_ID in .env to the real facility UUID for
  // the deployment. Leaving this empty string forces the registration screen
  // to always require an explicit facility UUID entry from the ASHA worker.
  // ---------------------------------------------------------------------------
  DEFAULT_FACILITY_ID: process.env.EXPO_PUBLIC_DEFAULT_FACILITY_ID ?? '',

  DEFAULT_FACILITY_NAME: 'Primary Health Centre',
  DEFAULT_ASHA_ID: '', // Not used in sync logic; backend uses authenticated identity
  SYNC_RETRY_LIMIT: 3,
  SYNC_INTERVAL_MS: 30000, // 30s auto-retry interval when online
};
