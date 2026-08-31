import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList, Patient, Visit } from '../../types';
import { Button, Card, SyncBadge } from '../../components';
import { colors } from '../../theme';
import { getPatientById } from '../../db/patients.repo';
import { getVisitsByPatientId } from '../../db/visits.repo';

type Props = NativeStackScreenProps<AppStackParamList, 'PatientDetails'>;

export const PatientDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { patientId } = route.params;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const p = await getPatientById(patientId);
      setPatient(p);
      const v = await getVisitsByPatientId(patientId);
      setVisits(v);
    } catch (e) {
      console.error('[PatientDetails] Error loading details:', e);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    loadData();
    return unsubscribe;
  }, [navigation, loadData]);

  if (loading || !patient) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Patient Profile</Text>
        <SyncBadge />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.patientName}>
                {patient.firstName} {patient.lastName}
              </Text>
              <Text style={styles.patientSub}>
                {patient.gender} • DOB: {patient.dateOfBirth}
              </Text>
            </View>
            {patient.isLocalOnly ? (
              <View style={styles.localBadge}>
                <Text style={styles.localBadgeText}>Local / Pending Sync</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ABHA ID:</Text>
            <Text style={styles.infoValue}>{patient.abhaId || 'Not Linked'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Facility:</Text>
            <Text style={styles.infoValue}>{patient.facilityId}</Text>
          </View>
        </Card>

        {/* Action Button: Capture New Visit */}
        <Button
          title="+ Capture Visit (Vitals & Symptoms)"
          variant="primary"
          onPress={() =>
            navigation.navigate('CaptureVisit', {
              patientId: patient.id,
              patientName: `${patient.firstName} ${patient.lastName}`,
            })
          }
          style={styles.captureButton}
        />

        {/* Visit History Section */}
        <Text style={styles.historyHeading}>Visit & Vitals History ({visits.length})</Text>

        {visits.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No field visits recorded yet for this patient.</Text>
          </Card>
        ) : (
          visits.map((visit) => (
            <Card key={visit.id} style={styles.visitCard}>
              <View style={styles.visitHeader}>
                <Text style={styles.visitDate}>
                  📅 {new Date(visit.createdAt).toLocaleDateString()} at{' '}
                  {new Date(visit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                {visit.isLocalOnly ? (
                  <View style={styles.localBadge}>
                    <Text style={styles.localBadgeText}>Offline Queued</Text>
                  </View>
                ) : (
                  <View style={styles.syncedBadge}>
                    <Text style={styles.syncedBadgeText}>Synced</Text>
                  </View>
                )}
              </View>

              {/* Vitals Summary Pill Grid */}
              <View style={styles.vitalsGrid}>
                {visit.vitals.systolic && visit.vitals.diastolic ? (
                  <View style={styles.vitalPill}>
                    <Text style={styles.vitalPillLabel}>BP</Text>
                    <Text style={styles.vitalPillValue}>
                      {visit.vitals.systolic}/{visit.vitals.diastolic} mmHg
                    </Text>
                  </View>
                ) : null}

                {visit.vitals.heartRate ? (
                  <View style={styles.vitalPill}>
                    <Text style={styles.vitalPillLabel}>Pulse</Text>
                    <Text style={styles.vitalPillValue}>{visit.vitals.heartRate} bpm</Text>
                  </View>
                ) : null}

                {visit.vitals.spO2 ? (
                  <View style={styles.vitalPill}>
                    <Text style={styles.vitalPillLabel}>SpO2</Text>
                    <Text style={styles.vitalPillValue}>{visit.vitals.spO2}%</Text>
                  </View>
                ) : null}

                {visit.vitals.temperature ? (
                  <View style={styles.vitalPill}>
                    <Text style={styles.vitalPillLabel}>Temp</Text>
                    <Text style={styles.vitalPillValue}>{visit.vitals.temperature}°F</Text>
                  </View>
                ) : null}

                {visit.vitals.respiratoryRate ? (
                  <View style={styles.vitalPill}>
                    <Text style={styles.vitalPillLabel}>Resp Rate</Text>
                    <Text style={styles.vitalPillValue}>{visit.vitals.respiratoryRate}/min</Text>
                  </View>
                ) : null}

                {visit.vitals.weight ? (
                  <View style={styles.vitalPill}>
                    <Text style={styles.vitalPillLabel}>Weight</Text>
                    <Text style={styles.vitalPillValue}>{visit.vitals.weight} kg</Text>
                  </View>
                ) : null}
              </View>

              {/* Symptoms */}
              {visit.symptoms && visit.symptoms.length > 0 ? (
                <View style={styles.symptomsSection}>
                  <Text style={styles.symptomsLabel}>Reported Symptoms:</Text>
                  <View style={styles.symptomsList}>
                    {visit.symptoms.map((s, idx) => (
                      <View key={idx} style={styles.symptomTag}>
                        <Text style={styles.symptomText}>
                          {s.name} ({s.severity}, {s.durationDays}d)
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {visit.notes ? (
                <Text style={styles.visitNotes}>📝 Notes: {visit.notes}</Text>
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>
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
  container: {
    padding: 18,
    paddingBottom: 40,
  },
  profileCard: {
    padding: 18,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  patientName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  patientSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  captureButton: {
    marginBottom: 20,
  },
  historyHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  visitCard: {
    padding: 16,
    marginBottom: 14,
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  visitDate: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  localBadge: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  localBadgeText: {
    fontSize: 10,
    color: '#92400e',
    fontWeight: '600',
  },
  syncedBadge: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  syncedBadgeText: {
    fontSize: 10,
    color: '#065f46',
    fontWeight: '600',
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  vitalPill: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  vitalPillLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  vitalPillValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  symptomsSection: {
    marginTop: 6,
    marginBottom: 6,
  },
  symptomsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  symptomsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  symptomTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  symptomText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  visitNotes: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 6,
  },
});
