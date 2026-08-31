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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { Button, Card, Header, Input } from '../../components';
import { colors } from '../../theme';
import { loginApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';
import { useSyncStore } from '../../store/syncStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = () => {
  const [phoneNumber, setPhoneNumber] = useState('9876543210');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { setAuth } = useAuthStore();
  const { isOnline } = useSyncStore();

  const handleLogin = async () => {
    setErrorMessage(null);

    const cleanPhone = phoneNumber.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      if (!isOnline) {
        // Offline login simulation if internet is down in the rural area
        await setAuth({
          token: 'offline-cached-asha-token',
          role: 'ASHA',
          phoneNumber: cleanPhone,
          userId: 'offline-asha-user',
        });
        return;
      }

      const res = await loginApi(cleanPhone, password);
      await setAuth({
        token: res.token,
        role: res.role || 'ASHA',
        phoneNumber: cleanPhone,
        userId: res.userId,
      });
    } catch (err: any) {
      if (err.response?.status === 429) {
        setErrorMessage('Too many login attempts. Please wait 15 minutes or test in offline mode.');
      } else if (err.response?.data?.message) {
        setErrorMessage(err.response.data.message);
      } else if (err.message) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Unable to connect to the server. Check your network or use offline mode.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOfflineBypass = async () => {
    await setAuth({
      token: 'offline-field-session-token',
      role: 'ASHA',
      phoneNumber: '9876543210',
      userId: 'asha-field-01',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="SwasthyaSetu" subtitle="ASHA / Field Worker Portal" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Card style={styles.card}>
            <View style={styles.titleContainer}>
              <Text style={styles.heading}>ASHA Worker Login</Text>
              <Text style={styles.subheading}>
                Enter your credentials to access field patient records and sync offline data.
              </Text>
            </View>

            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            ) : null}

            <Input
              label="Phone Number"
              placeholder="e.g. 9876543210"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              maxLength={15}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Button
              title="Sign In"
              variant="primary"
              loading={isLoading}
              onPress={handleLogin}
              style={styles.loginButton}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title="Continue in Offline Field Mode"
              variant="outline"
              onPress={handleOfflineBypass}
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
  keyboardView: {
    flex: 1,
  },
  container: {
    padding: 20,
    justifyContent: 'center',
    flexGrow: 1,
  },
  card: {
    padding: 22,
  },
  titleContainer: {
    marginBottom: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '500',
  },
  loginButton: {
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
