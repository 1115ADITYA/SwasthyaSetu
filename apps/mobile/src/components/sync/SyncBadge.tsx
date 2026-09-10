import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSyncStore } from '../../store/syncStore';
import { colors } from '../../theme';

interface SyncBadgeProps {
  onPress?: () => void;
}

export const SyncBadge: React.FC<SyncBadgeProps> = ({ onPress }) => {
  const { isOnline, isSyncing, pendingCount } = useSyncStore();

  const getStatusText = () => {
    if (isSyncing) return 'Syncing...';
    if (!isOnline) {
      return pendingCount > 0 ? `Offline (Pending: ${pendingCount})` : 'Offline';
    }
    return pendingCount > 0 ? `Pending Sync (${pendingCount})` : 'Synced';
  };

  const getBadgeStyle = () => {
    if (isSyncing) return styles.syncingBadge;
    if (!isOnline) return styles.offlineBadge;
    if (pendingCount > 0) return styles.pendingBadge;
    return styles.syncedBadge;
  };

  const getDotStyle = () => {
    if (isSyncing) return styles.syncingDot;
    if (!isOnline) return styles.offlineDot;
    if (pendingCount > 0) return styles.pendingDot;
    return styles.syncedDot;
  };

  const getTextStyle = () => {
    if (isSyncing) return styles.syncingText;
    if (!isOnline) return styles.offlineText;
    if (pendingCount > 0) return styles.pendingText;
    return styles.syncedText;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.container, getBadgeStyle()]}
    >
      <View style={[styles.dot, getDotStyle()]} />
      <Text style={[styles.text, getTextStyle()]}>{getStatusText()}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  syncedBadge: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  syncedDot: {
    backgroundColor: colors.success,
  },
  syncedText: {
    color: '#065f46',
  },
  pendingBadge: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  pendingDot: {
    backgroundColor: colors.accent,
  },
  pendingText: {
    color: '#92400e',
  },
  offlineBadge: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  offlineDot: {
    backgroundColor: colors.danger,
  },
  offlineText: {
    color: '#991b1b',
  },
  syncingBadge: {
    backgroundColor: colors.primaryLight,
    borderColor: '#bae6fd',
  },
  syncingDot: {
    backgroundColor: colors.primary,
  },
  syncingText: {
    color: colors.primaryDark,
  },
});
