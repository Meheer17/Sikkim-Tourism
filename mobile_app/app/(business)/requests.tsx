import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function BusinessRequests() {
    const requests = [
        { id: 'r1', type: 'service_approval', title: 'New Service Approval', detail: 'Approve "City Cab Premium"', time: '2h ago' },
        { id: 'r2', type: 'booking_refund', title: 'Refund Request', detail: 'Refund for booking #B1234', time: '1d ago' },
    ];

    const iconFor = (t: string) => t === 'service_approval' ? 'checkmark.seal.fill' : 'arrow.uturn.left';
    const colorFor = (t: string) => t === 'service_approval' ? '#10b981' : '#f59e0b';
    const bgFor = (t: string) => t === 'service_approval' ? '#d1fae5' : '#fef3c7';

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const textColor = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');
    return (
        <View style={styles.container}>
            <ScrollView style={styles.scroll} contentContainerStyle={[styles.content,{backgroundColor:background}]}>
                <View style={[styles.header,{backgroundColor:card}]}>
                    <Text style={[styles.headerTitle,{color:textColor}]}>Requests</Text>
                </View>
                {requests.map(r => (
                    <View key={r.id} style={[styles.card,{backgroundColor:card}]}>
                        <View style={styles.row}>
                            <View style={[styles.iconWrap, { backgroundColor: bgFor(r.type) }]}>
                                <IconSymbol name={iconFor(r.type) as any} size={20} color={colorFor(r.type)} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={[styles.title,{color:textColor}]}>{r.title}</Text>
                                <Text style={[styles.detail,{color:muted}]}>{r.detail}</Text>
                                <Text style={[styles.time,{color:muted}]}>{r.time}</Text>
                            </View>
                            <IconSymbol name="chevron.right" size={18} color="#9ca3af" />
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: tint }]}>
                                <IconSymbol name="checkmark" size={16} color="#fff" />
                                <Text style={styles.actionText}>Approve</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}>
                                <IconSymbol name="xmark" size={16} color="#fff" />
                                <Text style={styles.actionText}>Reject</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, paddingTop: 60, borderBottomWidth: 0 },
    headerTitle: { fontSize: 28, fontWeight: '700' },
    scroll: { flex: 1 },
    content: { padding: 16, paddingBottom: 100 },
    card: { borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    row: { flexDirection: 'row', alignItems: 'center' },
    iconWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 15, fontWeight: '700' },
    detail: { fontSize: 13, marginTop: 2 },
    time: { fontSize: 12, marginTop: 4 },
    actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
    actionText: { fontSize: 13, fontWeight: '600', color: '#fff' },
});
