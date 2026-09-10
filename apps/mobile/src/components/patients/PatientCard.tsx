import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Patient } from '../../types';
import { Card } from '../common/Card';
import { colors } from '../../theme';

interface PatientCardProps {
  patient: Patient;
  onPress: () => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient, onPress }) => {
  const calculateAge = (dobString: string): string => {
    try {
      const dob = new Date(dobString);
      const diff = Date.now() - dob.getTime();
      const ageDate = new Date(diff);
      const years = Math.abs(ageDate.getUTCFullYear() - 1970);
      return isNaN(years) ? dobString : `${years} yrs`;
    } catch {
      return dobString;
    }
  };

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>
            {patient.firstName} {patient.lastName}
          </Text>
          {patient.isLocalOnly ? (
            <View style={styles.localBadge}>
              <Text style={styles.localBadgeText}>Local / Pending Sync</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.detailsRow}>
          <Text style={styles.detailTag}>{patient.gender}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.detailTag}>Age: {calculateAge(patient.dateOfBirth)}</Text>
          {patient.abhaId ? (
            <>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.abhaTag}>ABHA: {patient.abhaId}</Text>
            </>
          ) : null}
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
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
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  detailTag: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  dot: {
    marginHorizontal: 6,
    color: colors.textMuted,
  },
  abhaTag: {
    fontSize: 12,
    color: colors.primaryDark,
    fontWeight: '500',
  },
});
