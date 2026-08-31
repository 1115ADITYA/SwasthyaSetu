import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
};

export type AppStackParamList = {
  Dashboard: undefined;
  PatientSearch: undefined;
  PatientRegistration: undefined;
  PatientDetails: { patientId: string };
  CaptureVisit: { patientId: string; patientName: string };
  SyncStatus: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppStackParamList>;
};
