import React, { useEffect, useState, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform, TextInput, Alert, Image, FlatList, Dimensions, Linking, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { geminiNotifier, GeminiPayload } from '@/utils/gemini-notifier';
import { businessService, locationService } from '@/services';
import { buildImageUrl } from '@/utils/image-url';
import { useThemeColor } from '@/hooks/use-theme-color';
import { platformConfig } from '@/config/api.config';

export default function GeminiPopup() {
  const [visible, setVisible] = useState(false);
  const [payload, setPayload] = useState<GeminiPayload | null>(null);
  const cooldownUntil = useRef<Date | null>(null);

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [hour, setHour] = useState<string>(new Date().getHours().toString());
  const [minute, setMinute] = useState<string>(new Date().getMinutes().toString());
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const background = useThemeColor('background');
  const card = useThemeColor('card');
  const textColor = useThemeColor('text');
  const tint = useThemeColor('tint');

  const slideAnim = useRef(new Animated.Value(-320)).current; // off-screen above

  useEffect(() => {
    const unsub = geminiNotifier.subscribe((p: any) => {
      const now = Date.now();
      if (cooldownUntil.current && now < cooldownUntil.current.getTime()) {
        console.log('GeminiPopup suppressed due to cooldown until', cooldownUntil.current.toISOString());
        return;
      }

      // normalize backend shapes into our GeminiPayload shape
      console.log('GeminiPopup received raw payload', p);
      const normalized: any = {
        agentMessage: p.agent_message || p.agentMessage || '',
        positiveText: p.buttons?.positive?.text || p.positiveText,
        negativeText: p.buttons?.negative?.text || p.negativeText,
        positiveAction: p.buttons?.positive?.action || p.positiveAction,
        negativeAction: p.buttons?.negative?.action || p.negativeAction,
        businessType: p.type || p.businessType,
        position: p.position || p.data?.position || p.position,
      };

      // Suppress showing popup for certain backend-driven actions
      // If any action is 'tourist_entry' or backend explicitly requested no popup, ignore
      const suppress = (
        normalized.positiveAction === 'tourist_entry' ||
        normalized.negativeAction === 'tourist_entry' ||
        normalized.businessType === 'tourist_entry' ||
        // some backends may include a direct flag
        p.no_popup === true ||
        p.action === 'tourist_entry' ||
        p.type === 'tourist_entry'
      );

      if (suppress) {
        console.log('GeminiPopup: suppressing popup for tourist_entry or no_popup flag', normalized);
        return;
      }

      setPayload(normalized);
      // show bar
      setVisible(true);
      // notify global state that popup is open
      try { geminiNotifier.setOpen(true); } catch (e) { /* ignore */ }
    });

    return () => unsub();
  }, []);

  

  const positiveText = payload?.positiveText || 'Yes';
  const negativeText = payload?.negativeText || 'No';

  // animate in when visible becomes true
  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    // reflect open state
    try { geminiNotifier.setOpen(!!visible); } catch (e) { /* ignore */ }
  }, [visible, slideAnim]);

  const hideBar = () => {
    Animated.timing(slideAnim, {
      toValue: -320,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      setPayload(null);
      try { geminiNotifier.setOpen(false); } catch (e) { /* ignore */ }
    });
  };

  // keep notifier open state in sync for other modals within this component
  useEffect(() => {
    const anyOpen = visible || showTimePicker || showResultsModal;
    try { geminiNotifier.setOpen(!!anyOpen); } catch (e) { /* ignore */ }
  }, [visible, showTimePicker, showResultsModal]);

  const onPositive = () => {
    if (!payload) {
      console.warn('GeminiPopup: positive action called with null payload');
      hideBar();
      return;
    }
    const action = payload.positiveAction;
    const businessType = (payload as any).businessType as string | undefined;
    const position = (payload as any).position as { x: number; y: number } | undefined;

    console.log('GeminiPopup positive action', payload);
    if (action === 'search') {
      triggerPlaceholderSearch(businessType, position);
      hideBar();
      return;
    }

    if (action === 'remind') {
      // Open a simple clock modal to pick hour/minute
      setShowTimePicker(true);
      return;
    }

    // default
    console.log('GeminiPopup positive pressed');
    hideBar();
  };

  const onNegative = () => {
    const action = (payload as any).negativeAction as string | undefined;
    // set random cooldown between 30 minutes and 2 hours
    const minutes = 30 + Math.random() * 90; // 30 to 120 minutes
    const ms = minutes * 60 * 1000;
    cooldownUntil.current = new Date(Date.now() + ms);

    if (action === 'return') {
      // Close and do nothing
      hideBar();
      return;
    }

    // default negative behaviour
    console.log('GeminiPopup negative pressed');
    hideBar();
  };

  const triggerPlaceholderSearch = async (businessType?: string, position?: { x: number; y: number } | undefined) => {
    // Sequence:
    // 1) get business type id of type
    // 2) search businesses with that type
    // 3) console.log results
    try {
      if (!businessType) {
        console.log('triggerPlaceholderSearch: no businessType provided');
        return;
      }

      // 1) get types
      const typesResp = await businessService.getTypes();
      const types = (typesResp && (typesResp as any).data) || [];

      const match = types.find((t: any) => (t.type || '').toLowerCase() === businessType.toLowerCase() || t.id === businessType);
      const typeId = match ? match.id : undefined;

      if (!typeId) {
        console.log('triggerPlaceholderSearch: no matching type id found for', businessType, 'types available=', types);
        return;
      }

      // show modal and spinner while we fetch
      setShowResultsModal(true);
      setSearchLoading(true);

      // 2) search businesses with that type id
      const listResp = await businessService.list({ type_id: typeId, limit: 20 });

      // 3) show modal carousel with name + small image
      const rawResults = (listResp && (listResp as any).data) || [];

      // For each business, try to populate l_id and then fetch the location's metadata
      // to use the location image as the business image. Fall back to business metadata.
      const results = await Promise.all(rawResults.map(async (item: any) => {
        const l_id = item.l_id || item.location_id || item.lId || null;
        let image_filename: string | null = null;
        let location_position: { x: number; y: number } | null = null;

        if (l_id) {
          try {
            const locResp = await locationService.get(l_id);
            const loc = locResp && (locResp as any).data;
            if (loc) {
              if (loc.metadata && Array.isArray(loc.metadata.images) && loc.metadata.images.length > 0) {
                image_filename = loc.metadata.images[0];
              }
              if (loc.position) {
                location_position = loc.position;
              }
            }
          } catch (e) {
            console.warn('GeminiPopup: failed to fetch location for l_id', l_id, e);
          }
        }

        if (!image_filename) {
          image_filename = item?.metadata?.images?.[0] || null;
        }

        const imageUrl = image_filename ? buildImageUrl(image_filename) : (item.imageUrl || item.thumbnailUrl || null);

        return {
          ...item,
          l_id,
          image_filename,
          imageUrl,
          location_position,
        };
      }));

      setSearchResults(results);
      setSearchLoading(false);
    } catch (e) {
      console.warn('triggerPlaceholderSearch failed', e);
    }
  };

  const scheduleReminder = () => {
    const h = parseInt(hour || '0', 10);
    const m = parseInt(minute || '0', 10);
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
      Alert.alert('Invalid time', 'Please enter a valid hour (0-23) and minute (0-59)');
      return;
    }

    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
    if (target.getTime() <= now.getTime()) {
      // schedule for next day
      target.setDate(target.getDate() + 1);
    }

    const delay = target.getTime() - now.getTime();
    const businessType = (payload as any).businessType as string | undefined;
    const position = (payload as any).position as { x: number; y: number } | undefined;

    setShowTimePicker(false);
    hideBar();
    Alert.alert('Reminder set', `Will trigger at ${target.toLocaleString()}`);

    setTimeout(() => {
      triggerPlaceholderSearch(businessType, position);
    }, delay);
  };

  return (
    <>
    {/* Top slide-in notification bar */}
    {visible && payload && (
      <Animated.View
        style={[
          styles.topBar,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBar}
        >
          <SafeAreaView style={styles.topBarInner}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>✨</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.topBarMessage} numberOfLines={3}>{payload.agentMessage}</Text>
              <View style={styles.topBarButtons}>
                <TouchableOpacity style={styles.topBarBtn} onPress={onPositive}>
                  <Text style={styles.topBarBtnText}>{positiveText}</Text>
                </TouchableOpacity>
                {negativeText !== 'no_negative_button' && (
                  <TouchableOpacity style={styles.topBarBtn} onPress={onNegative}>
                    <Text style={styles.topBarBtnText}>{negativeText}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </Animated.View>
    )}

    {/* Simple time picker modal for 'remind' action */}
    <Modal visible={showTimePicker} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: card }]}> 
          <Text style={[styles.title, { color: textColor }]}>Set reminder time</Text>

          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <TextInput
              value={hour}
              onChangeText={setHour}
              keyboardType="number-pad"
              style={{ flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 8, color: textColor }}
              placeholder="Hour (0-23)"
            />
            <TextInput
              value={minute}
              onChangeText={setMinute}
              keyboardType="number-pad"
              style={{ flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 8, color: textColor }}
              placeholder="Minute (0-59)"
            />
          </View>

          <View style={styles.buttonsRow}>
            <TouchableOpacity style={[styles.button, { backgroundColor: tint }]} onPress={scheduleReminder}>
              <Text style={[styles.buttonText]}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { borderWidth: 0, backgroundColor: '#eee' }]} onPress={() => setShowTimePicker(false)}>
              <Text style={[styles.buttonText, { color: '#333' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    {/* Search results carousel modal */}
    <Modal visible={showResultsModal} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: card }]}> 
          <Text style={[styles.title, { color: textColor }]}>Search results</Text>
          <Text style={[styles.message, { color: textColor, marginBottom: 8 }]}>Showing nearby { (payload as any)?.businessType || '' }</Text>

          <FlatList
            data={searchResults || []}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, idx) => (item?.id || String(idx))}
            renderItem={({ item }) => {
              const imageUri = item.imageUrl || item.thumbnailUrl || item.metadata?.images?.[0] || undefined;
              // Log the full image URL being requested for debugging
              console.log('GeminiPopup requesting image URL ->', imageUri, 'for item', item?.id || item?.name);

              const openDirections = (pos: { x: number; y: number } | undefined | null) => {
                if (!pos) {
                  Alert.alert('No location', 'No coordinates available for this item');
                  return;
                }
                const lat = pos.y;
                const lng = pos.x;
                const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lat + ',' + lng)}&travelmode=driving`;
                console.log('Opening directions URL', url);
                Linking.openURL(url).catch(err => console.warn('Failed to open maps', err));
                setShowResultsModal(false);
              };

              return (
                <TouchableOpacity onPress={() => openDirections(item.location_position || item.position)}>
                <View style={styles.resultCard}>
                  {imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.resultImage}
                      onLoadStart={() => console.log('Image onLoadStart', imageUri)}
                      onLoad={() => console.log('Image onLoad', imageUri)}
                      onError={(e) => console.warn('Image onError', imageUri, e.nativeEvent || e)}
                    />
                  ) : (
                    <View style={[styles.resultPlaceholder, { backgroundColor: '#eee' }]}>
                      <Text style={{ color: '#666' }}>No image</Text>
                    </View>
                  )}
                  <Text style={[{ color: textColor, marginTop: 8, fontWeight: '600' }]} numberOfLines={1}>{item.name || item.title || 'Unnamed'}</Text>
                </View>
                </TouchableOpacity>
              );
            }}
          />

          <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'flex-end' }}>
            <TouchableOpacity style={[styles.button, { backgroundColor: tint, paddingHorizontal: 16 }]} onPress={() => setShowResultsModal(false)}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </>
  );
}

// Results modal component styles and UI appended below

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  gradientBar: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    minHeight: platformConfig.isIOS ? 50 : 68, // Taller for Android
  },
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 62 : 20, // More padding for Android
    paddingBottom: Platform.OS === 'android' ? 28 : 0, // More padding for Android
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  iconText: {
    fontSize: 30,
  },
  topBarTitle: {
    fontSize: Platform.OS === 'android' ? 22 : 19,
    fontWeight: '800',
    marginBottom: 6,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  topBarMessage: {
    fontSize: Platform.OS === 'android' ? 20 : 17,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: Platform.OS === 'android' ? 28 : 24,
    textAlign: 'left',
    alignSelf: 'flex-start',
    width: '100%',
  },
  topBarButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  topBarBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flex: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  topBarBtnText: {
    color: '#667eea',
    fontWeight: '700',
    fontSize: Platform.OS === 'android' ? 18 : 15,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 12,
    padding: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    ...(Platform.OS === 'ios' && { minHeight: 480 }),
    ...(Platform.OS === 'android' && { minHeight: 440 }), // Even taller modal on Android
  },
  title: {
    fontSize: Platform.OS === 'android' ? 22 : 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    fontSize: Platform.OS === 'android' ? 19 : 16,
    marginBottom: 16,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: Platform.OS === 'android' ? 17 : 15,
  },
  resultCard: {
    width: Math.min(340, Dimensions.get('window').width - 60),
    marginRight: 12,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  resultImage: {
    width: '100%',
    height: Platform.OS === 'android' ? 210 : 200, // Even taller for Android
    borderRadius: 8,
    backgroundColor: '#ddd',
  },
  resultPlaceholder: {
    width: '100%',
    height: Platform.OS === 'android' ? 210 : 200, // Even taller for Android
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
