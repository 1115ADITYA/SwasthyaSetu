import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList, SyncQueueItem } from '../../types';
import { Button, Card, Header, SyncBadge } from '../../components';
import { colors } from '../../theme';
import { useSyncStore } from '../../store/syncStore';
import { getAllQueueItems, removeQueueItem } from '../../db/syncQueue.repo';
import { processSyncQueue } from '../../sync/syncEngine';

type Props = NativeStackScreenProps<AppStackParamList, 'SyncStatus'>;

export const SyncStatusScreen: React.FC<Props> = ({ navigation }) => {
  const [queueItems, setQueueItems] = useState<SyncQueueItem[]>([]);
  const [loading, setLoading] = useState(false);

  const { isOnline, isSyncing, pendingCount, lastSyncTime, lastErrorMessage } = useSyncStore();

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const items = await getAllQueueItems();
      setQueueItems(items);
    } catch (e) {
      console.error('[SyncStatus] Error loading queue items:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const handleManualSync = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Cannot sync while device is offline. Connect to Wi-Fi/cellular.');
      return;
    }
    await processSyncQueue();
    await loadQueue();
  };

  const handleClearItem = async (clientSyncId: string) => {
    Alert.alert('Remove Queue Item', 'Are you sure you want to discard this sync item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeQueueItem(clientSyncId);
          await loadQueue();
        },
      },
    ]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { bg: '#fffbeb', text: '#92400e', label: 'PENDING' };
      case 'SYNCING':
        return { bg: '#e0f2fe', text: '#0369a1', label: 'SYNCING' };
      case 'FAILED':
        return { bg: '#fef2f2', text: '#991b1b', label: 'FAILED' };
      default:
        return { bg: '#ecfdf5', text: '#065f46', label: status };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Sync Queue & Storage</Text>
        <SyncBadge />
      </View>

      <View style={styles.container}>
        {/* Status Overview Card */}
        <Card style={styles.overviewCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Network Connectivity:</Text>
            <View
              style={[
                styles.networkTag,
                isOnline ? styles.networkOnlineTag : styles.networkOfflineTag,
              ]}
            >
              <Text
                style={[
                  styles.networkTagText,
                  isOnline ? styles.networkOnlineText : styles.networkOfflineText,
                ]}
              >
                {isOnline ? '● Online (Connected)' : '● Offline (Disconnected)'}
              </Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Pending Sync Items:</Text>
            <Text style={styles.statusValue}>{pendingCount}</Text>
          </View>

          {lastSyncTime ? (
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Last Sync Attempt:</Text>
              <Text style={styles.statusValue}>
                {new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ) : null}

          {lastErrorMessage ? (
            <View style={styles.errorNotice}>
              <Text style={styles.errorNoticeText}>⚠️ Last Error: {lastErrorMessage}</Text>
            </View>
          ) : null}

          <Button
            title={isSyncing ? 'Syncing Now...' : 'Force Sync Now'}
            loading={isSyncing}
            disabled={!isOnline || isSyncing}
            variant="primary"
            onPress={handleManualSync}
            style={styles.syncBtn}
          />
        </Card>

        {/* Queue Items Header */}
        <View style={styles.queueHeaderRow}>
          <Text style={styles.queueHeading}>Local SQLite Sync Queue ({queueItems.length})</Text>
          <TouchableOpacity onPress={loadQueue}>
            <Text style={styles.refreshLink}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={queueItems}
          keyExtractor={(item) => item.clientSyncId}
          renderItem={({ item }) => {
            const badge = getStatusBadge(item.status);
            return (
              <Card style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemOperation}>{item.operation}</Text>
                  <View style={[styles.itemBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.itemBadgeText, { color: badge.text }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.itemSyncId}>Client UUID: {item.clientSyncId}</Text>
                <Text style={styles.itemMeta}>
                  Retries: {item.retryCount} • Created:{' '}
                  {new Date(item.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>

                {item.errorMessage ? (
                  <Text style={styles.itemError}>Error: {item.errorMessage}</Text>
                ) : null}

                <View style={styles.itemActionsRow}>
                  <TouchableOpacity onPress={() => handleClearItem(item.clientSyncId)}>
                    <Text style={styles.discardText}>Discard Item</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          }}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyQueue}>
                <Text style={styles.emptyQueueText}>
                  ✨ All local records are synced with PostgreSQL. No pending operations.
                </Text>
              </View>
            ) : (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            )
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  overviewCard: {
    padding: 16,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  networkTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  networkOnlineTag: {
    backgroundColor: '#ecfdf5',
  },
  networkOfflineTag: {
    backgroundColor: '#fef2f2',
  },
  networkTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  networkOnlineText: {
    color: '#065f46',
  },
  networkOfflineText: {
    color: '#991b1b',
  },
  errorNotice: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    padding: 8,
    borderRadius: 6,
    marginVertical: 6,
  },
  errorNoticeText: {
    fontSize: 12,
    color: '#9a3412',
  },
  syncBtn: {
    marginTop: 8,
  },
  queueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  queueHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  refreshLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  itemCard: {
    padding: 14,
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemOperation: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  itemBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemSyncId: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  itemError: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
  },
  itemActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
  },
  discardText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '600',
  },
  emptyQueue: {
    padding: 24,
    alignItems: 'center',
  },
  emptyQueueText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
