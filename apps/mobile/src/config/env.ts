import { Platform } from 'react-native';

// In development:
// - Physical Android/iOS on LAN: Use LAN IPv4 (192.168.0.102)
// - Android Emulator: Use 10.0.2.2
// - iOS Simulator: Use localhost
const DEV_LAN_IP = '192.168.1.111';
const BACKEND_PORT = '3000';

export const ENV = {
  API_BASE_URL: `http://${DEV_LAN_IP}:${BACKEND_PORT}`,
  DEFAULT_FACILITY_ID: 'phc-pune-01',
  DEFAULT_FACILITY_NAME: 'Primary Health Centre - Pune Rural',
  DEFAULT_ASHA_ID: 'asha-worker-01',
  SYNC_RETRY_LIMIT: 3,
  SYNC_INTERVAL_MS: 30000, // 30s auto-retry interval when online
};
