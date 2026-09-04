import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppStackParamList, Patient } from '../../types';
import { Button, Header, PatientCard, SyncBadge } from '../../components';
import { colors } from '../../theme';
import { searchLocalPatients, getAllLocalPatients, upsertPatientsBatch } from '../../db/patients.repo';
import { searchPatientsApi, getPatientsApi } from '../../api/patients.api';
import { useSyncStore } from '../../store/syncStore';

type Props = NativeStackScreenProps<AppStackParamList, 'PatientSearch'>;
type FilterTab = 'ALL' | 'LOCAL_ONLY' | 'SYNCED';

export const PatientSearchScreen: React.FC<Props> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  const { isOnline } = useSyncStore();

  const loadPatients = useCallback(async (query: string) => {
    setLoading(true);
    try {
      if (query.trim()) {
        // 1. Search SQLite local cache first (instant response)
        const localResults = await searchLocalPatients(query);
        setPatients(localResults);

        // 2. If online, fetch from remote backend API and cache results
        if (isOnline) {
          setIsSearchingOnline(true);
          try {
            const remoteResults = await searchPatientsApi(query);
            if (remoteResults && remoteResults.length > 0) {
              await upsertPatientsBatch(remoteResults);
              // Reload merged local cache
              const merged = await searchLocalPatients(query);
              setPatients(merged);
            }
          } catch (apiErr) {
            console.warn('[PatientSearch] Online search failed, using local cache:', apiErr);
          } finally {
            setIsSearchingOnline(false);
          }
        }
      } else {
        // Empty query: load all locally cached patients
        const allLocal = await getAllLocalPatients();
        setPatients(allLocal);

        if (isOnline && allLocal.length === 0) {
          try {
            const remoteAll = await getPatientsApi();
            if (remoteAll && remoteAll.length > 0) {
              await upsertPatientsBatch(remoteAll);
              setPatients(await getAllLocalPatients());
            }
          } catch (e) {
            console.warn('[PatientSearch] Initial remote list fetch skipped:', e);
          }
        }
      }
    } catch (err) {
      console.error('[PatientSearch] Error loading patients:', err);
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  useEffect(() => {
    loadPatients(searchQuery);
  }, [loadPatients, searchQuery]);

  const filteredPatients = patients.filter((p) => {
    if (activeTab === 'LOCAL_ONLY') return p.isLocalOnly;
    if (activeTab === 'SYNCED') return !p.isLocalOnly;
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Patient Search</Text>
        <SyncBadge />
      </View>

      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, ABHA ID..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {isSearchingOnline ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.searchSpinner} />
        ) : null}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsRow}>
        <TouchableOpacity
          onPress={() => setActiveTab('ALL')}
          style={[styles.filterTab, activeTab === 'ALL' && styles.filterTabActive]}
        >
          <Text style={[styles.filterTabText, activeTab === 'ALL' && styles.filterTabTextActive]}>
            All ({patients.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('LOCAL_ONLY')}
          style={[styles.filterTab, activeTab === 'LOCAL_ONLY' && styles.filterTabActive]}
        >
          <Text
            style={[
              styles.filterTabText,
              activeTab === 'LOCAL_ONLY' && styles.filterTabTextActive,
            ]}
          >
            Local ({patients.filter((p) => p.isLocalOnly).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('SYNCED')}
          style={[styles.filterTab, activeTab === 'SYNCED' && styles.filterTabActive]}
        >
          <Text
            style={[
              styles.filterTabText,
              activeTab === 'SYNCED' && styles.filterTabTextActive,
            ]}
          >
            Synced ({patients.filter((p) => !p.isLocalOnly).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLinkButton}
          onPress={() => navigation.navigate('PatientRegistration')}
        >
          <Text style={styles.registerLinkText}>+ Register</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredPatients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <PatientCard
            patient={item}
            onPress={() => navigation.navigate('PatientDetails', { patientId: item.id })}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Patients Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `No matches for "${searchQuery}". You can register this citizen directly.`
                  : activeTab === 'LOCAL_ONLY'
                  ? 'No offline-created patients currently pending sync.'
                  : 'No patients in local storage yet. Register a patient to get started.'}
              </Text>
              <Button
                title="Register New Patient"
                variant="primary"
                onPress={() => navigation.navigate('PatientRegistration')}
                style={styles.emptyButton}
              />
            </View>
          ) : (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.surface,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
  },
  searchSpinner: {
    position: 'absolute',
    right: 28,
    top: 22,
  },
  filterTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: colors.primaryLight,
    borderColor: '#bae6fd',
  },
  filterTabText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  registerLinkButton: {
    marginLeft: 'auto',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  registerLinkText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyButton: {
    width: '100%',
    maxWidth: 240,
  },
});
