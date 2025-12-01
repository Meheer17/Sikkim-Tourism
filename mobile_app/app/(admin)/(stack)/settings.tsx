import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';

export default function AdminSettings() {
    const [auditLogs, setAuditLogs] = React.useState(true);
    const [autoApprove, setAutoApprove] = React.useState(false);
    const [notifyAdmins, setNotifyAdmins] = React.useState(true);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Admin Settings</Text>
                <Text style={styles.headerSub}>Controls affecting org management</Text>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.item}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>Audit Logs</Text>
                        <Text style={styles.itemSub}>Keep track of changes made by admins</Text>
                    </View>
                    <Switch value={auditLogs} onValueChange={setAuditLogs} />
                </View>

                <View style={styles.item}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>Auto-approve trusted orgs</Text>
                        <Text style={styles.itemSub}>Skip manual review for whitelisted orgs</Text>
                    </View>
                    <Switch value={autoApprove} onValueChange={setAutoApprove} />
                </View>

                <View style={styles.item}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>Notify admins on changes</Text>
                        <Text style={styles.itemSub}>Send alerts when org status is updated</Text>
                    </View>
                    <Switch value={notifyAdmins} onValueChange={setNotifyAdmins} />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    headerTitle: { fontSize: 28, fontWeight: '700', color: '#11181C' },
    headerSub: { fontSize: 13, color: '#687076', marginTop: 4 },
    content: { padding: 16, paddingBottom: 100 },
    item: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
    itemTitle: { fontSize: 16, fontWeight: '700', color: '#11181C' },
    itemSub: { fontSize: 13, color: '#687076', marginTop: 2 },
});
