import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../types/navigation';
import { Button, Card, Header } from '../../components';
import { colors } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'PatientSearch'>;

export const PatientSearchPlaceholderScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Patient Search" subtitle="Stack Navigation Screen" />
      <View style={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.title}>Patient Search Screen</Text>
          <Text style={styles.text}>
            This placeholder verifies child stack navigation within AppNavigator.
          </Text>

          <Button
            title="← Back to Dashboard"
            variant="outline"
            onPress={() => navigation.goBack()}
          />
        </Card>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
});
