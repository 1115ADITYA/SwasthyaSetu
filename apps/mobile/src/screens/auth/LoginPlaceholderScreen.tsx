import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList, RootStackParamList } from '../../types/navigation';
import { Button, Card, Header } from '../../components';
import { colors } from '../../theme';
import { CompositeScreenProps } from '@react-navigation/native';

type Props = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParamList, 'Login'>,
  NativeStackScreenProps<RootStackParamList>
>;

export const LoginPlaceholderScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="SwasthyaSetu" subtitle="ASHA / Field Worker Portal" />
      <View style={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.welcomeTitle}>Welcome Back</Text>
          <Text style={styles.description}>
            Milestone 1 Foundation Initialized. This is a navigation placeholder screen for ASHA login.
          </Text>

          <View style={styles.buttonContainer}>
            <Button
              title="Enter ASHA App (Verify Flow)"
              variant="primary"
              onPress={() => {
                navigation.navigate('App', { screen: 'Dashboard' });
              }}
            />
          </View>
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
    justifyContent: 'center',
  },
  card: {
    padding: 24,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    marginTop: 8,
  },
});
