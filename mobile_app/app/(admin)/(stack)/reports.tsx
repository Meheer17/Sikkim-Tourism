import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

type ReportType = 'users' | 'businesses' | 'revenue' | 'activities';

export default function ReportsScreen() {
    const router = useRouter();
    const [selectedType, setSelectedType] = useState<ReportType>('users');

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    const reportTypes = [
        { id: 'users' as ReportType, label: 'User Reports', icon: 'person.3.fill' },
        { id: 'businesses' as ReportType, label: 'Business Reports', icon: 'building.2.fill' },
        { id: 'revenue' as ReportType, label: 'Revenue Reports', icon: 'dollarsign.circle.fill' },
        { id: 'activities' as ReportType, label: 'Activity Logs', icon: 'chart.line.uptrend.xyaxis' },
    ];

    const sampleReports = [
        { name: 'Monthly User Growth', date: '2025-12-01', size: '2.4 MB' },
        { name: 'Business Performance Q4', date: '2025-11-28', size: '5.1 MB' },
        { name: 'Revenue Analysis Nov', date: '2025-11-25', size: '3.8 MB' },
        { name: 'Admin Activity Logs', date: '2025-12-02', size: '1.2 MB' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: card }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <IconSymbol name="chevron.left" size={24} color={text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: text }]}>Reports</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Report Type Selector */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: text }]}>Report Type</Text>
                    <View style={styles.typeGrid}>
                        {reportTypes.map((type) => (
                            <TouchableOpacity
                                key={type.id}
                                style={[
                                    styles.typeCard,
                                    { backgroundColor: card, borderColor: muted + '30' },
                                    selectedType === type.id && { borderColor: tint, backgroundColor: tint + '15' },
                                ]}
                                onPress={() => setSelectedType(type.id)}
                            >
                                <IconSymbol
                                    name={type.icon as any}
                                    size={28}
                                    color={selectedType === type.id ? tint : muted}
                                />
                                <Text
                                    style={[
                                        styles.typeLabel,
                                        { color: selectedType === type.id ? tint : text },
                                    ]}
                                >
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Generate Report */}
                <View style={styles.section}>
                    <TouchableOpacity style={[styles.generateButton, { backgroundColor: tint }]}>
                        <IconSymbol name="plus.circle.fill" size={20} color="#fff" />
                        <Text style={styles.generateButtonText}>Generate New Report</Text>
                    </TouchableOpacity>
                </View>

                {/* Recent Reports */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: text }]}>Recent Reports</Text>
                    <View style={styles.reportList}>
                        {sampleReports.map((report, index) => (
                            <View
                                key={index}
                                style={[styles.reportCard, { backgroundColor: card, borderColor: muted + '20' }]}
                            >
                                <View style={[styles.reportIcon, { backgroundColor: tint + '15' }]}>
                                    <IconSymbol name="doc.text.fill" size={24} color={tint} />
                                </View>
                                <View style={styles.reportInfo}>
                                    <Text style={[styles.reportName, { color: text }]}>{report.name}</Text>
                                    <Text style={[styles.reportMeta, { color: muted }]}>
                                        {report.date} · {report.size}
                                    </Text>
                                </View>
                                <TouchableOpacity style={styles.downloadButton}>
                                    <IconSymbol name="arrow.down.circle.fill" size={24} color={tint} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    typeCard: {
        width: '48%',
        padding: 20,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        gap: 8,
    },
    typeLabel: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    generateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 12,
    },
    generateButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    reportList: {
        gap: 12,
    },
    reportCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    reportIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reportInfo: {
        flex: 1,
    },
    reportName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    reportMeta: {
        fontSize: 13,
    },
    downloadButton: {
        padding: 4,
    },
});
