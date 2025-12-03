import { getLanguageTranslations } from '@/constants/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BusinessBookings from './bookings';
import BusinessRequests from './requests';

export default function BusinessManage() {
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const [tab, setTab] = useState<'bookings' | 'requests'>('bookings');
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const textColor = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    return (
        <View style={[styles.container,{backgroundColor:background}]}>            
            <ScrollView style={styles.scroll} contentContainerStyle={[styles.content,{backgroundColor:background}]}>                
                <View style={[styles.header,{backgroundColor:card}]}>                    
                    <Text style={[styles.headerTitle,{color:textColor}]}>Manage</Text>
                    <Text style={[styles.headerSub,{color:muted}]}>Bookings are confirmed reservations. Requests are items awaiting your approval (new bookings, changes, refunds, special quotes).</Text>
                </View>
                <View style={[styles.switchRow,{backgroundColor:card}]}>                    
                    <TouchableOpacity
                        style={[styles.switchBtn,{borderColor:tab==='bookings'?tint:card,backgroundColor:tab==='bookings'?tint+'33':card}]}
                        onPress={() => setTab('bookings')}
                    >
                        <Text style={[styles.switchText,{color:tab==='bookings'?tint:muted}]}>
                            Bookings
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.switchBtn,{borderColor:tab==='requests'?tint:card,backgroundColor:tab==='requests'?tint+'33':card}]}
                        onPress={() => setTab('requests')}
                    >
                        <Text style={[styles.switchText,{color:tab==='requests'?tint:muted}]}>Requests</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                    {tab === 'bookings' ? <BusinessBookings /> : <BusinessRequests />}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, paddingTop: 60, borderBottomWidth: 0 },
    headerTitle: { fontSize: 28, fontWeight: '700' },
    headerSub: { fontSize: 13, marginTop: 6 },
    scroll: { flex: 1 },
    content: { padding: 20, paddingBottom: 100 },
    switchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
    switchBtn: { flex: 1, paddingVertical: 10, borderRadius: 999, borderWidth: 1, alignItems: 'center' },
    switchText: { fontSize: 13, fontWeight: '600' },
});
