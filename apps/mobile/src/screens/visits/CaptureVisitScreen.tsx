import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList, Symptom, Vitals } from '../../types';
import { Button, Card, Header, Input, Select, SyncBadge } from '../../components';
import { colors } from '../../theme';
import { queueLocalVisit } from '../../sync/syncEngine';
import { useSyncStore } from '../../store/syncStore';

type Props = NativeStackScreenProps<AppStackParamList, 'CaptureVisit'>;

const PRESET_SYMPTOMS = [
  'Fever',
  'Cough',
  'Shortness of Breath',
  'Headache',
  'Body Ache',
  'Diarrhea',
  'Chest Pain',
  'Fatigue',
];

export const CaptureVisitScreen: React.FC<Props> = ({ route, navigation }) => {
  const { patientId, patientName } = route.params;

  // Vitals State
  const [temp, setTemp] = useState('98.6');
  const [systolic, setSystolic] = useState('120');
  const [diastolic, setDiastolic] = useState('80');
  const [heartRate, setHeartRate] = useState('72');
  const [spO2, setSpO2] = useState('98');
  const [respRate, setRespRate] = useState('18');
  const [weight, setWeight] = useState('60');

  // Symptoms State
  const [symptoms, setSymptoms] = useState<Symptom[]>([
    { name: 'Fever', severity: 'MILD', durationDays: 2, notes: '' },
  ]);

  // Current symptom add helper
  const [customSymptomName, setCustomSymptomName] = useState('');
  const [currentSeverity, setCurrentSeverity] = useState<'MILD' | 'MODERATE' | 'SEVERE'>('MILD');
  const [currentDuration, setCurrentDuration] = useState('2');

  // General Notes
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const { isOnline } = useSyncStore();

  const addPresetSymptom = (name: string) => {
    if (symptoms.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      return;
    }
    setSymptoms([
      ...symptoms,
      { name, severity: currentSeverity, durationDays: parseInt(currentDuration, 10) || 1 },
    ]);
  };

  const addCustomSymptom = () => {
    if (!customSymptomName.trim()) return;
    setSymptoms([
      ...symptoms,
      {
        name: customSymptomName.trim(),
        severity: currentSeverity,
        durationDays: parseInt(currentDuration, 10) || 1,
      },
    ]);
    setCustomSymptomName('');
  };

  const removeSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, idx) => idx !== index));
  };

  const handleSubmitVisit = async () => {
    // Validate clinical ranges
    const numTemp = parseFloat(temp);
    const numSys = parseInt(systolic, 10);
    const numDia = parseInt(diastolic, 10);
    const numHr = parseInt(heartRate, 10);
    const numSpo2 = parseInt(spO2, 10);
    const numResp = parseInt(respRate, 10);
    const numWt = parseFloat(weight);

    if (numSys && (numSys < 50 || numSys > 260)) {
      Alert.alert('Validation Error', 'Systolic BP must be between 50 and 260 mmHg');
      return;
    }
    if (numDia && (numDia < 30 || numDia > 160)) {
      Alert.alert('Validation Error', 'Diastolic BP must be between 30 and 160 mmHg');
      return;
    }
    if (numHr && (numHr < 30 || numHr > 220)) {
      Alert.alert('Validation Error', 'Heart rate must be between 30 and 220 bpm');
      return;
    }
    if (numSpo2 && (numSpo2 < 50 || numSpo2 > 100)) {
      Alert.alert('Validation Error', 'SpO2 must be between 50% and 100%');
      return;
    }

    setLoading(true);

    const vitalsPayload: Vitals = {
      temperature: isNaN(numTemp) ? undefined : numTemp,
      systolic: isNaN(numSys) ? undefined : numSys,
      diastolic: isNaN(numDia) ? undefined : numDia,
      heartRate: isNaN(numHr) ? undefined : numHr,
      spO2: isNaN(numSpo2) ? undefined : numSpo2,
      respiratoryRate: isNaN(numResp) ? undefined : numResp,
      weight: isNaN(numWt) ? undefined : numWt,
    };

    try {
      await queueLocalVisit({
        patientId,
        status: 'COMPLETED',
        notes: notes.trim(),
        vitals: vitalsPayload,
        symptoms,
      });

      Alert.alert(
        'Visit Recorded',
        isOnline
          ? 'Visit saved locally and submitted to server!'
          : 'Visit saved locally on device and queued for sync when internet is available.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to record visit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>‹ Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Record Field Visit</Text>
        <SyncBadge />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Patient Banner */}
          <Card style={styles.patientBanner}>
            <Text style={styles.patientBannerLabel}>Patient</Text>
            <Text style={styles.patientBannerName}>{patientName}</Text>
          </Card>

          {/* Section 1: Vitals */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>1. Clinical Vitals</Text>

            <View style={styles.row}>
              <Input
                label="Systolic BP (mmHg)"
                placeholder="120"
                keyboardType="numeric"
                value={systolic}
                onChangeText={setSystolic}
                containerStyle={styles.halfCol}
              />
              <Input
                label="Diastolic BP (mmHg)"
                placeholder="80"
                keyboardType="numeric"
                value={diastolic}
                onChangeText={setDiastolic}
                containerStyle={styles.halfCol}
              />
            </View>

            <View style={styles.row}>
              <Input
                label="Pulse Rate (bpm)"
                placeholder="72"
                keyboardType="numeric"
                value={heartRate}
                onChangeText={setHeartRate}
                containerStyle={styles.halfCol}
              />
              <Input
                label="SpO2 (%)"
                placeholder="98"
                keyboardType="numeric"
                value={spO2}
                onChangeText={setSpO2}
                containerStyle={styles.halfCol}
              />
            </View>

            <View style={styles.row}>
              <Input
                label="Temperature (°F)"
                placeholder="98.6"
                keyboardType="numeric"
                value={temp}
                onChangeText={setTemp}
                containerStyle={styles.halfCol}
              />
              <Input
                label="Resp Rate (/min)"
                placeholder="18"
                keyboardType="numeric"
                value={respRate}
                onChangeText={setRespRate}
                containerStyle={styles.halfCol}
              />
            </View>

            <Input
              label="Weight (kg)"
              placeholder="60"
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
            />
          </Card>

          {/* Section 2: Symptoms */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>2. Symptoms Assessment</Text>

            <Text style={styles.subLabel}>Quick Add Symptoms:</Text>
            <View style={styles.presetChips}>
              {PRESET_SYMPTOMS.map((name) => (
                <TouchableOpacity
                  key={name}
                  onPress={() => addPresetSymptom(name)}
                  style={styles.chip}
                >
                  <Text style={styles.chipText}>+ {name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.customAddRow}>
              <Input
                label="Or Custom Symptom"
                placeholder="e.g. Skin Rash"
                value={customSymptomName}
                onChangeText={setCustomSymptomName}
                containerStyle={{ flex: 1, marginBottom: 0 }}
              />
              <Button
                title="Add"
                variant="secondary"
                onPress={addCustomSymptom}
                style={styles.customAddBtn}
              />
            </View>

            {/* Configured Symptoms List */}
            <Text style={[styles.subLabel, { marginTop: 16 }]}>
              Selected Symptoms ({symptoms.length}):
            </Text>

            {symptoms.map((s, idx) => (
              <View key={idx} style={styles.symptomItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.symptomItemName}>• {s.name}</Text>
                  <Text style={styles.symptomItemMeta}>
                    Severity: {s.severity} | Duration: {s.durationDays} day(s)
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeSymptom(idx)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </Card>

          {/* Section 3: Notes */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>3. Field Worker Notes</Text>
            <Input
              label="Observations / Advice Given"
              placeholder="Enter any guidance provided or referral recommendations..."
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />
          </Card>

          {/* Submit */}
          <Button
            title={isOnline ? 'Save & Submit Visit' : 'Save Locally (Offline Mode)'}
            variant="primary"
            loading={loading}
            onPress={handleSubmitVisit}
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
    padding: 16,
    paddingBottom: 40,
  },
  patientBanner: {
    padding: 14,
    backgroundColor: colors.primaryLight,
    borderColor: '#bae6fd',
    marginBottom: 14,
  },
  patientBannerLabel: {
    fontSize: 11,
    color: colors.primaryDark,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  patientBannerName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: 2,
  },
  sectionCard: {
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCol: {
    flex: 1,
  },
  subLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  presetChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  chipText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  customAddRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  customAddBtn: {
    minHeight: 44,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  symptomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  symptomItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  symptomItemMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  removeBtn: {
    padding: 6,
  },
  removeBtnText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: 6,
    marginBottom: 20,
  },
});
