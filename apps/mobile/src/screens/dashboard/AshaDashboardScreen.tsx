import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppStackParamList, Patient, Visit } from '../../types';
import { Button, Card, Header, SyncBadge } from '../../components';
import { colors } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useSyncStore } from '../../store/syncStore';
import { getTodayVisitsCount, getVisitsByPatientId } from '../../db/visits.repo';
import { getAllLocalPatients } from '../../db/patients.repo';
import { processSyncQueue } from '../../sync/syncEngine';
import { ENV } from '../../config/env';

type Props = NativeStackScreenProps<AppStackParamList, 'Dashboard'>;

export const AshaDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [todayCount, setTodayCount] = useState(0);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const { phoneNumber, role, logout, isAuthenticated } = useAuthStore();
  const { isOnline, isSyncing, pendingCount, refreshPendingCount } = useSyncStore();

  const loadDashboardData = useCallback(async () => {
    try {
      const count = await getTodayVisitsCount();
      setTodayCount(count);
      const allPatients = await getAllLocalPatients();
      setRecentPatients(allPatients.slice(0, 3));
      await refreshPendingCount();
    } catch (e) {
      console.error('[Dashboard] Error loading stats:', e);
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDashboardData();
    });
    loadDashboardData();
    return unsubscribe;
  }, [navigation, loadDashboardData]);

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
        {/* Offline Banner when disconnected */}
        {!isOnline ? (
          <View style={styles.offlineAlert}>
            <Text style={styles.offlineAlertIcon}>📡</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.offlineAlertTitle}>Working in Offline Field Mode</Text>
              <Text style={styles.offlineAlertText}>
                All visits and patient registrations are saved securely on device and will sync automatically when internet is available.
              </Text>
            </View>
          </View>
        ) : null}

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
                  {!isOnline
                    ? 'Offline records saved. They will sync when internet is available.'
                    : isAuthenticated
                    ? 'Queued records are ready to sync.'
                    : 'Login to sync queued records.'}
                </Text>
              </View>
              {isOnline ? (
                <Button
                  title={isAuthenticated ? (isSyncing ? 'Syncing...' : 'Sync Now') : 'Login to Sync'}
                  loading={isSyncing && isAuthenticated}
                  variant="primary"
                  onPress={
                    isAuthenticated
                      ? handleManualSync
                      : () => {
                          // The easiest way to force a re-login in this app architecture is to logout
                          // which takes the user back to the AuthStack.
                          logout();
                        }
                  }
                  style={styles.syncNowButton}
                />
              ) : null}
            </View>
          </Card>
        ) : null}

        {/* Field Actions */}
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

        {/* Recent Patients */}
        {recentPatients.length > 0 ? (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.sectionHeading}>Recent Patients</Text>
              <TouchableOpacity onPress={() => navigation.navigate('PatientSearch')}>
                <Text style={styles.viewAllText}>View All ›</Text>
              </TouchableOpacity>
            </View>

            {recentPatients.map((p) => (
              <TouchableOpacity
                key={p.id}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('PatientDetails', { patientId: p.id })}
              >
                <Card style={styles.recentPatientCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recentPatientName}>
                      {p.firstName} {p.lastName}
                    </Text>
                    <Text style={styles.recentPatientSub}>
                      {p.gender} • DOB: {p.dateOfBirth}
                    </Text>
                  </View>
                  {p.isLocalOnly ? (
                    <View style={styles.recentLocalBadge}>
                      <Text style={styles.recentLocalBadgeText}>Local</Text>
                    </View>
                  ) : (
                    <Text style={styles.recentActionText}>Open ›</Text>
                  )}
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

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
  offlineAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 10,
  },
  offlineAlertIcon: {
    fontSize: 22,
  },
  offlineAlertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 2,
  },
  offlineAlertText: {
    fontSize: 11,
    color: '#3b82f6',
    lineHeight: 15,
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
  recentSection: {
    marginTop: 8,
    marginBottom: 12,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  viewAllText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  recentPatientCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
  },
  recentPatientName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  recentPatientSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  recentLocalBadge: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recentLocalBadgeText: {
    fontSize: 10,
    color: '#92400e',
    fontWeight: '600',
  },
  recentActionText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 16,
  },
});
