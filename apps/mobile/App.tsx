import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation';
import { getDatabase } from './src/db/database';
import { initSyncEngine } from './src/sync/syncEngine';
import { colors } from './src/theme';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cleanupSync: (() => void) | undefined;

    const setupApp = async () => {
      try {
        // 1. Initialize SQLite Database & Tables
        await getDatabase();
        setDbReady(true);

        // 2. Start Sync Engine Network Listener
        cleanupSync = initSyncEngine();
      } catch (err: any) {
        console.error('[App] Database / Sync init failed:', err);
        setError(err?.message || 'Database initialization error');
      }
    };

    setupApp();

    return () => {
      if (cleanupSync) cleanupSync();
    };
  }, []);

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to initialize app storage</Text>
        <Text style={styles.errorSub}>{error}</Text>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Initializing SwasthyaSetu...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.danger,
    marginBottom: 8,
  },
  errorSub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
