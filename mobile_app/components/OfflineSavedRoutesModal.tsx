import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, FlatList, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';
import { AppStorage } from '@/utils/storage';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface SavedRouteItem {
  id: string;
  name: string;
  createdAt?: string;
  coords?: Array<{ latitude: number; longitude: number }>;
}

export default function OfflineSavedRoutesModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [savedRoutes, setSavedRoutes] = useState<SavedRouteItem[]>([]);
  const router = useRouter();
  const cardBg = useThemeColor('card');
  const text = useThemeColor('text');

  useEffect(() => {
    (async () => {
      const routes = await AppStorage.getItem<SavedRouteItem[]>('saved_routes', []);
      setSavedRoutes(routes || []);
    })();
  }, [visible]);

  const openSavedRoute = (routeId: string) => {
    onClose();
    // push to explore with param
    router.push({ pathname: '/(user)/explore', params: { saved_route_id: routeId } } as any);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: cardBg }]}> 
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: text }]}>Offline - Saved Routes</Text>
              <Text style={[styles.subtitle, { color: text }]}>Internet is not connected. Showing saved routes for offline use.</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <IconSymbol name="xmark" size={20} color={text as any} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={savedRoutes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.row} onPress={() => openSavedRoute(item.id)}>
                <Text style={[styles.routeName, { color: text }]} numberOfLines={1}>{item.name || 'Unnamed Route'}</Text>
                <Text style={styles.routeTime}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <View style={styles.empty}><Text style={{ color: text }}>No saved routes</Text></View>
            )}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  container: { maxHeight: Platform.OS === 'ios' ? 420 : 460, borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },
  closeBtn: { padding: 8 },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' as any },
  routeName: { fontSize: 16, fontWeight: '600' },
  routeTime: { fontSize: 12, color: '#666' as any },
  empty: { paddingVertical: 20, alignItems: 'center' },
});
