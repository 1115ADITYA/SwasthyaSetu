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
import { AppStackParamList } from '../../types';
import { Button, Card, Header, Input, Select, SyncBadge } from '../../components';
import { colors } from '../../theme';
import { queueLocalPatientRegistration } from '../../sync/syncEngine';
import { createPatientApi } from '../../api/patients.api';
import { upsertPatient } from '../../db/patients.repo';
import { useSyncStore } from '../../store/syncStore';
import { ENV } from '../../config/env';

type Props = NativeStackScreenProps<AppStackParamList, 'PatientRegistration'>;

export const PatientRegistrationScreen: React.FC<Props> = ({ navigation }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('1990-05-15');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('FEMALE');
  const [abhaId, setAbhaId] = useState('');
  const [facilityId, setFacilityId] = useState(ENV.DEFAULT_FACILITY_ID);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { isOnline } = useSyncStore();

  const validate = () => {
    const errs: { [key: string]: string } = {};

    if (!firstName.trim()) {
      errs.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      errs.lastName = 'Last name is required';
    }
    if (!dob.trim()) {
      errs.dob = 'Date of birth is required';
    } else if (isNaN(Date.parse(dob.trim()))) {
      errs.dob = 'Invalid date format. Use YYYY-MM-DD (e.g. 1990-05-15)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth: dob.trim(),
      gender,
      facilityId: facilityId.trim() || ENV.DEFAULT_FACILITY_ID,
      abhaId: abhaId.trim() || undefined,
    };

    try {
      if (isOnline) {
        try {
          const res = await createPatientApi(payload);
          if (res?.patient) {
            await upsertPatient(res.patient, false);
            Alert.alert('Success', 'Patient registered successfully on server!', [
              {
                text: 'View Profile',
                onPress: () =>
                  navigation.replace('PatientDetails', { patientId: res.patient.id }),
              },
            ]);
            return;
          }
        } catch (apiErr: any) {
          console.warn('[Registration] Online registration failed, saving offline:', apiErr);
          // Fall through to offline queue
        }
      }

      // Offline mode or API network fallback
      const { patient } = await queueLocalPatientRegistration(payload);
      Alert.alert(
        'Offline Registration Saved',
        'Patient saved securely on your device and queued for background sync when internet is restored.',
        [
          {
            text: 'View Local Profile',
            onPress: () =>
              navigation.replace('PatientDetails', { patientId: patient.id }),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save patient record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Patient Registration</Text>
        <SyncBadge />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Demographic Information</Text>

            <Input
              label="First Name *"
              placeholder="e.g. Sunita"
              value={firstName}
              onChangeText={setFirstName}
              error={errors.firstName}
            />

            <Input
              label="Last Name *"
              placeholder="e.g. Patil"
              value={lastName}
              onChangeText={setLastName}
              error={errors.lastName}
            />

            <Input
              label="Date of Birth (YYYY-MM-DD) *"
              placeholder="1990-05-15"
              value={dob}
              onChangeText={setDob}
              error={errors.dob}
            />

            <Select<'MALE' | 'FEMALE' | 'OTHER'>
              label="Gender *"
              selectedValue={gender}
              onSelect={setGender}
              options={[
                { label: 'Female', value: 'FEMALE' },
                { label: 'Male', value: 'MALE' },
                { label: 'Other', value: 'OTHER' },
              ]}
            />

            <Input
              label="ABHA Health ID (Optional)"
              placeholder="e.g. 14-digit ABHA or sunita@abdm"
              value={abhaId}
              onChangeText={setAbhaId}
            />

            <Input
              label="Assigned Facility ID"
              placeholder="e.g. phc-pune-01"
              value={facilityId}
              onChangeText={setFacilityId}
            />

            <Button
              title={isOnline ? 'Register Patient' : 'Save Patient (Offline Mode)'}
              variant="primary"
              loading={loading}
              onPress={handleRegister}
              style={styles.submitButton}
            />
          </Card>
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
    padding: 18,
    paddingBottom: 40,
  },
  card: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 14,
  },
});
