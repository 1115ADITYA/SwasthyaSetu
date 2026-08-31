import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppStackParamList } from '../types/navigation';
import { HomePlaceholderScreen } from '../screens/dashboard/HomePlaceholderScreen';
import { PatientSearchPlaceholderScreen } from '../screens/patients/PatientSearchPlaceholderScreen';

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Dashboard" component={HomePlaceholderScreen} />
      <Stack.Screen name="PatientSearch" component={PatientSearchPlaceholderScreen} />
    </Stack.Navigator>
  );
};
