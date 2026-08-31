import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CompositeScreenProps } from '@react-navigation/native';
import { AppStackParamList, RootStackParamList } from '../../types/navigation';
import { Button, Card, Header } from '../../components';
import { colors } from '../../theme';

type Props = CompositeScreenProps<
  NativeStackScreenProps<AppStackParamList, 'Dashboard'>,
  NativeStackScreenProps<RootStackParamList>
>;

export const HomePlaceholderScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="ASHA Dashboard" subtitle="SwasthyaSetu Field App" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.badge}>Foundation Verified</Text>
          <Text style={styles.title}>Milestone 1 Active</Text>
          <Text style={styles.text}>
            Navigation and Expo foundation initialized successfully.
          </Text>

          <View style={styles.actions}>
            <Button
              title="Go to Patient Search (Stack Verification)"
              variant="secondary"
              onPress={() => navigation.navigate('PatientSearch')}
              style={styles.actionButton}
            />
            <Button
              title="Sign Out / Back to Auth"
              variant="outline"
              onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
              style={styles.actionButton}
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 20,
  },
  card: {
    padding: 20,
    marginBottom: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondaryLight,
    color: colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    marginVertical: 4,
  },
});
