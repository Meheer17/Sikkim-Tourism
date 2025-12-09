import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageTranslations } from '@/constants/translations';
import { messageService, MessageWithUser } from '@/services/message.service';
import Toast from 'react-native-toast-message';

export default function ChatModerationScreen() {
    const router = useRouter();
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    
    const [flaggedMessages, setFlaggedMessages] = useState<MessageWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [initialized, setInitialized] = useState(false);

    // Theme colors
    const screenBg = useThemeColor('background');
    const cardBg = useThemeColor('card');
    const text = useThemeColor('text');
    const mutedText = useThemeColor('mutedText');
    const tint = useThemeColor('tint');
    const border = useThemeColor('border');
    
    // Use hardcoded colors for error/success since theme doesn't have them
    const successColor = '#10b981';

    const loadFlaggedMessages = useCallback(async (showLoader = true) => {
        if (showLoader) setLoading(true);
        try {
            const response = await messageService.getFlaggedMessages({ limit: 100 });
            if (response.success && response.data) {
                setFlaggedMessages(response.data);
            }
        } catch (err) {
            console.error('Error loading flagged messages:', err);
            Toast.show({
                type: 'error',
                text1: t.error || 'Error',
                text2: t.failedToLoad || 'Failed to load flagged messages',
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []); // Remove dependency on 't' to prevent recreating

    useEffect(() => {
        if (!initialized) {
            setInitialized(true);
            loadFlaggedMessages();
        }
    }, [initialized, loadFlaggedMessages]);

    const handleModerateMessage = async (messageId: string, action: 'hide' | 'restore' | 'delete') => {
        const actionLabels = {
            hide: t.hide || 'Hide',
            restore: t.restore || 'Restore',
            delete: t.delete || 'Delete',
        };
        
        const confirmMessages = {
            hide: t.confirmHideMessage || 'This will hide the message from the chat.',
            restore: t.confirmRestoreMessage || 'This will restore the message to the chat.',
            delete: t.confirmDeleteMessage || 'This will permanently delete the message. This action cannot be undone.',
        };

        Alert.alert(
            `${actionLabels[action]} ${t.message || 'Message'}?`,
            confirmMessages[action],
            [
                { text: t.cancel || 'Cancel', style: 'cancel' },
                {
                    text: actionLabels[action],
                    style: action === 'delete' ? 'destructive' : 'default',
                    onPress: async () => {
                        setActionLoading(messageId);
                        try {
                            const response = await messageService.moderateMessage(messageId, action);
                            if (response.success) {
                                Toast.show({
                                    type: 'success',
                                    text1: t.success || 'Success',
                                    text2: `${t.messageHas || 'Message has been'} ${action === 'hide' ? (t.hidden || 'hidden') : action === 'restore' ? (t.restored || 'restored') : (t.deleted || 'deleted')}`,
                                });
                                // Refresh the list
                                loadFlaggedMessages(false);
                            } else {
                                throw new Error(response.errors?.[0] || 'Failed to moderate message');
                            }
                        } catch (err: any) {
                            Toast.show({
                                type: 'error',
                                text1: t.error || 'Error',
                                text2: err?.message || t.failedToModerate || 'Failed to moderate message',
                            });
                        } finally {
                            setActionLoading(null);
                        }
                    },
                },
            ]
        );
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadFlaggedMessages();
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'flagged': return '#f59e0b';
            case 'hidden': return '#ef4444';
            case 'active': return '#10b981';
            default: return mutedText;
        }
    };

    const getStatusLabel = (status?: string) => {
        switch (status) {
            case 'flagged': return t.flagged || 'Flagged';
            case 'hidden': return t.hidden || 'Hidden';
            case 'active': return t.active || 'Active';
            case 'deleted': return t.deleted || 'Deleted';
            default: return status || 'Unknown';
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: screenBg }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: border }]}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <IconSymbol name="chevron.left" size={24} color={text as string} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: text }]}>
                        {t.chatModeration || 'Chat Moderation'}
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: mutedText }]}>
                        {t.reviewFlaggedMessages || 'Review and manage flagged messages'}
                    </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: '#fef3c7' }]}>
                    <Text style={styles.badgeText}>{flaggedMessages.length}</Text>
                </View>
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={tint as string} />
                    <Text style={[styles.loadingText, { color: mutedText }]}>
                        {t.loadingFlaggedMessages || 'Loading flagged messages...'}
                    </Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={handleRefresh} 
                            tintColor={tint as string} 
                        />
                    }
                >
                    {flaggedMessages.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <IconSymbol name="checkmark.shield" size={64} color={successColor} />
                            <Text style={[styles.emptyTitle, { color: text }]}>
                                {t.noFlaggedMessages || 'No Flagged Messages'}
                            </Text>
                            <Text style={[styles.emptySubtitle, { color: mutedText }]}>
                                {t.allClear || 'All messages are clear! The community is well-behaved.'}
                            </Text>
                        </View>
                    ) : (
                        flaggedMessages.map((message) => (
                            <View 
                                key={message.id} 
                                style={[styles.messageCard, { backgroundColor: cardBg, borderColor: border }]}
                            >
                                {/* Message Header */}
                                <View style={styles.messageHeader}>
                                    <View style={[styles.avatar, { backgroundColor: tint }]}>
                                        <Text style={styles.avatarText}>{message.user_avatar || '?'}</Text>
                                    </View>
                                    <View style={styles.messageHeaderInfo}>
                                        <Text style={[styles.userName, { color: text }]}>{message.user_name}</Text>
                                        <Text style={[styles.messageDate, { color: mutedText }]}>
                                            {formatDate(message.created_at)}
                                        </Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(message.status) + '20' }]}>
                                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(message.status) }]} />
                                        <Text style={[styles.statusText, { color: getStatusColor(message.status) }]}>
                                            {getStatusLabel(message.status)}
                                        </Text>
                                    </View>
                                </View>

                                {/* Message Content */}
                                <View style={[styles.messageContent, { backgroundColor: screenBg }]}>
                                    <Text style={[styles.messageText, { color: text }]}>{message.text}</Text>
                                </View>

                                {/* Flag Info */}
                                <View style={styles.flagInfo}>
                                    <IconSymbol name="flag.fill" size={14} color="#f59e0b" />
                                    <Text style={[styles.flagCount, { color: '#f59e0b' }]}>
                                        {message.flagged_count || 1} {(message.flagged_count || 1) === 1 ? (t.report || 'report') : (t.reports || 'reports')}
                                    </Text>
                                </View>

                                {/* Action Buttons */}
                                <View style={styles.actionButtons}>
                                    {message.status === 'flagged' && (
                                        <>
                                            <TouchableOpacity
                                                style={[styles.actionButton, styles.restoreButton]}
                                                onPress={() => handleModerateMessage(message.id, 'restore')}
                                                disabled={actionLoading === message.id}
                                            >
                                                {actionLoading === message.id ? (
                                                    <ActivityIndicator size="small" color="#10b981" />
                                                ) : (
                                                    <>
                                                        <IconSymbol name="checkmark.circle" size={18} color="#10b981" />
                                                        <Text style={[styles.actionButtonText, { color: '#10b981' }]}>
                                                            {t.approve || 'Approve'}
                                                        </Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.actionButton, styles.hideButton]}
                                                onPress={() => handleModerateMessage(message.id, 'hide')}
                                                disabled={actionLoading === message.id}
                                            >
                                                {actionLoading === message.id ? (
                                                    <ActivityIndicator size="small" color="#f59e0b" />
                                                ) : (
                                                    <>
                                                        <IconSymbol name="eye.slash" size={18} color="#f59e0b" />
                                                        <Text style={[styles.actionButtonText, { color: '#f59e0b' }]}>
                                                            {t.hide || 'Hide'}
                                                        </Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        </>
                                    )}
                                    {message.status === 'hidden' && (
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.restoreButton]}
                                            onPress={() => handleModerateMessage(message.id, 'restore')}
                                            disabled={actionLoading === message.id}
                                        >
                                            {actionLoading === message.id ? (
                                                <ActivityIndicator size="small" color="#10b981" />
                                            ) : (
                                                <>
                                                    <IconSymbol name="arrow.uturn.backward" size={18} color="#10b981" />
                                                    <Text style={[styles.actionButtonText, { color: '#10b981' }]}>
                                                        {t.restore || 'Restore'}
                                                    </Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.deleteButton]}
                                        onPress={() => handleModerateMessage(message.id, 'delete')}
                                        disabled={actionLoading === message.id}
                                    >
                                        {actionLoading === message.id ? (
                                            <ActivityIndicator size="small" color="#ef4444" />
                                        ) : (
                                            <>
                                                <IconSymbol name="trash" size={18} color="#ef4444" />
                                                <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>
                                                    {t.delete || 'Delete'}
                                                </Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
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
        padding: 20,
        paddingTop: 60,
        borderBottomWidth: 1,
        gap: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 12,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#b45309',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    messageCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
    },
    messageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    messageHeaderInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
    },
    messageDate: {
        fontSize: 12,
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    messageContent: {
        marginTop: 12,
        padding: 12,
        borderRadius: 8,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    flagInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 6,
    },
    flagCount: {
        fontSize: 13,
        fontWeight: '500',
    },
    actionButtons: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    restoreButton: {
        backgroundColor: '#dcfce7',
    },
    hideButton: {
        backgroundColor: '#fef3c7',
    },
    deleteButton: {
        backgroundColor: '#fee2e2',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
