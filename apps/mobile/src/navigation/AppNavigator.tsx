import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppStackParamList } from '../types';
import { AshaDashboardScreen } from '../screens/dashboard/AshaDashboardScreen';
import { PatientSearchScreen } from '../screens/patients/PatientSearchScreen';
import { PatientRegistrationScreen } from '../screens/patients/PatientRegistrationScreen';
import { PatientDetailsScreen } from '../screens/patients/PatientDetailsScreen';
import { CaptureVisitScreen } from '../screens/visits/CaptureVisitScreen';
import { SyncStatusScreen } from '../screens/sync/SyncStatusScreen';

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Dashboard" component={AshaDashboardScreen} />
      <Stack.Screen name="PatientSearch" component={PatientSearchScreen} />
      <Stack.Screen name="PatientRegistration" component={PatientRegistrationScreen} />
      <Stack.Screen name="PatientDetails" component={PatientDetailsScreen} />
      <Stack.Screen name="CaptureVisit" component={CaptureVisitScreen} />
      <Stack.Screen name="SyncStatus" component={SyncStatusScreen} />
    </Stack.Navigator>
  );
};
