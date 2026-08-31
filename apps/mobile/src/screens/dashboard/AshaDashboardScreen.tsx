import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../types';
import { Button, Card, Header, SyncBadge } from '../../components';
import { colors } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useSyncStore } from '../../store/syncStore';
import { getTodayVisitsCount } from '../../db/visits.repo';
import { processSyncQueue } from '../../sync/syncEngine';
import { ENV } from '../../config/env';

type Props = NativeStackScreenProps<AppStackParamList, 'Dashboard'>;

export const AshaDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [todayCount, setTodayCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const { phoneNumber, role, logout } = useAuthStore();
  const { isOnline, isSyncing, pendingCount, refreshPendingCount } = useSyncStore();

  const loadDashboardData = useCallback(async () => {
    try {
      const count = await getTodayVisitsCount();
      setTodayCount(count);
      await refreshPendingCount();
    } catch (e) {
      console.error('[Dashboard] Error loading stats:', e);
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    if (isOnline) {
      await processSyncQueue();
    }
    setRefreshing(false);
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      alert('Device is currently offline. Sync will run automatically when connection returns.');
      return;
    }
    await processSyncQueue();
    await loadDashboardData();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.appTitle}>SwasthyaSetu</Text>
          <Text style={styles.appSubtitle}>ASHA Field Companion</Text>
        </View>
        <SyncBadge onPress={() => navigation.navigate('SyncStatus')} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Worker Info Card */}
        <Card style={styles.workerCard}>
          <View style={styles.workerHeader}>
            <View>
              <Text style={styles.workerName}>ASHA Worker</Text>
              <Text style={styles.workerPhone}>📱 {phoneNumber || 'Field Officer'}</Text>
            </View>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>{role || 'ASHA'}</Text>
            </View>
          </View>
          <View style={styles.facilityRow}>
            <Text style={styles.facilityLabel}>Assigned Facility:</Text>
            <Text style={styles.facilityName}>{ENV.DEFAULT_FACILITY_NAME}</Text>
          </View>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{todayCount}</Text>
            <Text style={styles.statLabel}>Today's Visits</Text>
          </Card>

          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('SyncStatus')}
          >
            <Card
              style={[
                styles.statCard,
                pendingCount > 0 ? styles.statCardPending : styles.statCardSynced,
              ]}
            >
              <Text
                style={[
                  styles.statValue,
                  pendingCount > 0 ? styles.statValuePending : styles.statValueSynced,
                ]}
              >
                {pendingCount}
              </Text>
              <Text style={styles.statLabel}>
                {pendingCount > 0 ? 'Pending Sync' : 'All Synced'}
              </Text>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Sync Trigger Card if items pending */}
        {pendingCount > 0 ? (
          <Card style={styles.syncCard}>
            <View style={styles.syncCardContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.syncCardTitle}>Offline Records Queued</Text>
                <Text style={styles.syncCardSubtitle}>
                  {isOnline
                    ? 'Internet is available. Push queued data to server.'
                    : 'Records saved securely on device. Will auto-sync when online.'}
                </Text>
              </View>
              {isOnline ? (
                <Button
                  title={isSyncing ? 'Syncing...' : 'Sync Now'}
                  loading={isSyncing}
                  variant="primary"
                  onPress={handleManualSync}
                  style={styles.syncNowButton}
                />
              ) : null}
            </View>
          </Card>
        ) : null}

        {/* Action Buttons */}
        <Text style={styles.sectionHeading}>Field Actions</Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('PatientSearch')}
          style={styles.actionCard}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: colors.primaryLight }]}>
            <Text style={styles.actionIcon}>🔍</Text>
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Search & View Patients</Text>
            <Text style={styles.actionSubtitle}>
              Look up patient history, vitals timeline, or start a new visit.
            </Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('PatientRegistration')}
          style={styles.actionCard}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: colors.secondaryLight }]}>
            <Text style={styles.actionIcon}>➕</Text>
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Register New Patient</Text>
            <Text style={styles.actionSubtitle}>
              Enroll citizen with ABHA ID, demographics, and local caching.
            </Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('SyncStatus')}
          style={styles.actionCard}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: '#fef3c7' }]}>
            <Text style={styles.actionIcon}>🔄</Text>
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Sync Queue & Storage</Text>
            <Text style={styles.actionSubtitle}>
              Inspect pending operations, retry status, and local SQLite cache.
            </Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        {/* Sign Out */}
        <Button
          title="Sign Out"
          variant="outline"
          onPress={logout}
          style={styles.logoutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  appSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  container: {
    padding: 18,
    paddingBottom: 40,
  },
  workerCard: {
    padding: 16,
    marginBottom: 16,
  },
  workerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  workerName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  workerPhone: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  roleTag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  facilityRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 4,
  },
  facilityLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  facilityName: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  statCardPending: {
    borderColor: '#fde68a',
    backgroundColor: '#fffdf5',
  },
  statCardSynced: {
    borderColor: '#a7f3d0',
    backgroundColor: '#f6fdfa',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statValuePending: {
    color: '#b45309',
  },
  statValueSynced: {
    color: '#059669',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  syncCard: {
    padding: 14,
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    marginBottom: 16,
  },
  syncCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  syncCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 2,
  },
  syncCardSubtitle: {
    fontSize: 12,
    color: '#78350f',
  },
  syncNowButton: {
    minHeight: 38,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
    marginTop: 4,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  actionArrow: {
    fontSize: 22,
    color: colors.textMuted,
    fontWeight: '600',
    marginLeft: 8,
  },
  logoutButton: {
    marginTop: 16,
  },
});
