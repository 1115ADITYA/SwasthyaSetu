import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Role, AuthResponse } from '../types';

interface AuthState {
  token: string | null;
  role: Role | null;
  phoneNumber: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (data: { token: string; role: Role; phoneNumber?: string; userId?: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadSavedAuth: () => Promise<void>;
}

const AUTH_STORAGE_KEY = '@swasthyasetu_auth_session';

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  role: null,
  phoneNumber: null,
  userId: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async ({ token, role, phoneNumber, userId }) => {
    try {
      const sessionData = { token, role, phoneNumber, userId };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
      set({
        token,
        role,
        phoneNumber: phoneNumber || null,
        userId: userId || null,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (e) {
      console.error('[AuthStore] Error saving auth session:', e);
      set({ token, role, phoneNumber: phoneNumber || null, userId: userId || null, isAuthenticated: true, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.error('[AuthStore] Error clearing auth session:', e);
    }
    set({
      token: null,
      role: null,
      phoneNumber: null,
      userId: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  loadSavedAuth: async () => {
    try {
      const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.token && parsed?.role) {
          set({
            token: parsed.token,
            role: parsed.role,
            phoneNumber: parsed.phoneNumber || null,
            userId: parsed.userId || null,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      }
    } catch (e) {
      console.error('[AuthStore] Error reading saved auth:', e);
    }
    set({ isLoading: false });
  },
}));
