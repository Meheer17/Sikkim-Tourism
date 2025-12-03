import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function AdminSettings() {
    const router = useRouter();
    const [auditLogs, setAuditLogs] = React.useState(true);
    const [autoApprove, setAutoApprove] = React.useState(false);
    const [notifyAdmins, setNotifyAdmins] = React.useState(true);

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            <View style={[styles.header, { backgroundColor: card, borderBottomColor: muted + '40' }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <IconSymbol name="chevron.left" size={24} color={text} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={[styles.headerTitle, { color: text }]}>Admin Settings</Text>
                    <Text style={[styles.headerSub, { color: muted }]}>Controls affecting org management</Text>
                </View>
                <View style={styles.placeholder} />
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.item, { backgroundColor: card, borderColor: muted + '20' }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.itemTitle, { color: text }]}>Audit Logs</Text>
                        <Text style={[styles.itemSub, { color: muted }]}>Keep track of changes made by admins</Text>
                    </View>
                    <Switch
                        value={auditLogs}
                        onValueChange={setAuditLogs}
                        trackColor={{ false: muted + '40', true: tint + '40' }}
                        thumbColor={auditLogs ? tint : '#f4f3f4'}
                    />
                </View>

                <View style={[styles.item, { backgroundColor: card, borderColor: muted + '20' }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.itemTitle, { color: text }]}>Auto-approve trusted orgs</Text>
                        <Text style={[styles.itemSub, { color: muted }]}>Skip manual review for whitelisted orgs</Text>
                    </View>
                    <Switch
                        value={autoApprove}
                        onValueChange={setAutoApprove}
                        trackColor={{ false: muted + '40', true: tint + '40' }}
                        thumbColor={autoApprove ? tint : '#f4f3f4'}
                    />
                </View>

                <View style={[styles.item, { backgroundColor: card, borderColor: muted + '20' }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.itemTitle, { color: text }]}>Notify admins on changes</Text>
                        <Text style={[styles.itemSub, { color: muted }]}>Send alerts when org status is updated</Text>
                    </View>
                    <Switch
                        value={notifyAdmins}
                        onValueChange={setNotifyAdmins}
                        trackColor={{ false: muted + '40', true: tint + '40' }}
                        thumbColor={notifyAdmins ? tint : '#f4f3f4'}
                    />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContent: {
        flex: 1,
        alignItems: 'center',
    },
    placeholder: {
        width: 40,
    },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    headerSub: { fontSize: 13, marginTop: 4 },
    content: { padding: 16, paddingBottom: 100 },
    item: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
    },
    itemTitle: { fontSize: 16, fontWeight: '700' },
    itemSub: { fontSize: 13, marginTop: 2 },
});
