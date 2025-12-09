import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function SecurityScreen() {
    const router = useRouter();

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(true);
    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: '',
    });

    const handleChangePassword = () => {
        if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
            Alert.alert('Error', 'Please fill in all password fields');
            return;
        }
        if (passwordData.new !== passwordData.confirm) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }
        Alert.alert('Success', 'Password changed successfully');
        setPasswordData({ current: '', new: '', confirm: '' });
    };

    const sessions = [
        { device: 'iPhone 15 Pro', location: 'Gangtok, Sikkim', time: 'Active now', current: true },
        { device: 'MacBook Pro', location: 'Gangtok, Sikkim', time: '2 hours ago', current: false },
        { device: 'iPad Air', location: 'Delhi, India', time: '1 day ago', current: false },
    ];

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: card, borderBottomColor: muted + '40' }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <IconSymbol name="chevron.left" size={24} color={text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: text }]}>Security</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Change Password */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: text }]}>Change Password</Text>
                    <View style={styles.form}>
                        <TextInput
                            style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                            placeholder="Current Password"
                            placeholderTextColor={muted}
                            value={passwordData.current}
                            onChangeText={(text) => setPasswordData({ ...passwordData, current: text })}
                            secureTextEntry
                        />
                        <TextInput
                            style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                            placeholder="New Password"
                            placeholderTextColor={muted}
                            value={passwordData.new}
                            onChangeText={(text) => setPasswordData({ ...passwordData, new: text })}
                            secureTextEntry
                        />
                        <TextInput
                            style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                            placeholder="Confirm New Password"
                            placeholderTextColor={muted}
                            value={passwordData.confirm}
                            onChangeText={(text) => setPasswordData({ ...passwordData, confirm: text })}
                            secureTextEntry
                        />
                        <TouchableOpacity
                            style={[styles.changePasswordButton, { backgroundColor: tint }]}
                            onPress={handleChangePassword}
                        >
                            <Text style={styles.changePasswordText}>Update Password</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Security Settings */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: text }]}>Security Settings</Text>
                    <View style={[styles.settingsCard, { backgroundColor: card, borderColor: muted + '20' }]}>
                        <View style={styles.settingItem}>
                            <View style={styles.settingLeft}>
                                <IconSymbol name="lock.shield.fill" size={24} color={tint} />
                                <View style={styles.settingInfo}>
                                    <Text style={[styles.settingTitle, { color: text }]}>Two-Factor Authentication</Text>
                                    <Text style={[styles.settingText, { color: muted }]}>
                                        Add an extra layer of security
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={twoFactorEnabled}
                                onValueChange={setTwoFactorEnabled}
                                trackColor={{ false: muted + '40', true: tint + '40' }}
                                thumbColor={twoFactorEnabled ? tint : '#f4f3f4'}
                            />
                        </View>
                        <View style={[styles.settingDivider, { backgroundColor: muted + '20' }]} />
                        <View style={styles.settingItem}>
                            <View style={styles.settingLeft}>
                                <IconSymbol name="faceid" size={24} color={tint} />
                                <View style={styles.settingInfo}>
                                    <Text style={[styles.settingTitle, { color: text }]}>Biometric Login</Text>
                                    <Text style={[styles.settingText, { color: muted }]}>
                                        Use Face ID or Touch ID
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={biometricEnabled}
                                onValueChange={setBiometricEnabled}
                                trackColor={{ false: muted + '40', true: tint + '40' }}
                                thumbColor={biometricEnabled ? tint : '#f4f3f4'}
                            />
                        </View>
                    </View>
                </View>

                {/* Active Sessions */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: text }]}>Active Sessions</Text>
                    <View style={styles.sessionList}>
                        {sessions.map((session, index) => (
                            <View
                                key={index}
                                style={[styles.sessionCard, { backgroundColor: card, borderColor: muted + '20' }]}
                            >
                                <View style={[styles.sessionIcon, { backgroundColor: tint + '15' }]}>
                                    <IconSymbol
                                        name={session.device.includes('iPhone') ? 'iphone' : session.device.includes('MacBook') ? 'laptopcomputer' : 'ipad'}
                                        size={24}
                                        color={tint}
                                    />
                                </View>
                                <View style={styles.sessionInfo}>
                                    <View style={styles.sessionHeader}>
                                        <Text style={[styles.sessionDevice, { color: text }]}>{session.device}</Text>
                                        {session.current && (
                                            <View style={[styles.currentBadge, { backgroundColor: '#10b981' + '15' }]}>
                                                <Text style={styles.currentBadgeText}>Current</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={[styles.sessionLocation, { color: muted }]}>{session.location}</Text>
                                    <Text style={[styles.sessionTime, { color: muted }]}>{session.time}</Text>
                                </View>
                                {!session.current && (
                                    <TouchableOpacity style={styles.revokeButton}>
                                        <IconSymbol name="xmark.circle.fill" size={24} color="#ef4444" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Danger Zone */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>Danger Zone</Text>
                    <TouchableOpacity style={[styles.dangerButton, { borderColor: '#fee2e2' }]}>
                        <IconSymbol name="trash.fill" size={20} color="#ef4444" />
                        <Text style={styles.dangerButtonText}>Delete Account</Text>
                    </TouchableOpacity>
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
    form: {
        gap: 12,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
    },
    changePasswordButton: {
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    changePasswordText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    settingsCard: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    settingInfo: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    settingText: {
        fontSize: 13,
    },
    settingDivider: {
        height: 1,
        marginHorizontal: 16,
    },
    sessionList: {
        gap: 12,
    },
    sessionCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
        alignItems: 'center',
    },
    sessionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sessionInfo: {
        flex: 1,
    },
    sessionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    sessionDevice: {
        fontSize: 15,
        fontWeight: '600',
    },
    currentBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    currentBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#10b981',
    },
    sessionLocation: {
        fontSize: 13,
        marginBottom: 2,
    },
    sessionTime: {
        fontSize: 12,
    },
    revokeButton: {
        padding: 4,
    },
    dangerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 8,
        borderWidth: 2,
    },
    dangerButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ef4444',
    },
});
