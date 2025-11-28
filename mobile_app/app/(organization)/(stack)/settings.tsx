import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';

export default function OrgSettings() {
    const [publicListings, setPublicListings] = React.useState(true);
    const [autoPublishEvents, setAutoPublishEvents] = React.useState(false);
    const [notifyOnSales, setNotifyOnSales] = React.useState(true);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Organization Settings</Text>
                <Text style={styles.headerSub}>Preferences for places, events, and tickets</Text>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.item}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>Public listings</Text>
                        <Text style={styles.itemSub}>Show your places/events publicly</Text>
                    </View>
                    <Switch value={publicListings} onValueChange={setPublicListings} />
                </View>
                <View style={styles.item}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>Auto-publish events</Text>
                        <Text style={styles.itemSub}>New events go live automatically</Text>
                    </View>
                    <Switch value={autoPublishEvents} onValueChange={setAutoPublishEvents} />
                </View>
                <View style={styles.item}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>Notify on ticket sales</Text>
                        <Text style={styles.itemSub}>Receive alerts when tickets sell</Text>
                    </View>
                    <Switch value={notifyOnSales} onValueChange={setNotifyOnSales} />
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