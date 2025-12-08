import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageTranslations } from '@/constants/translations';
import { useAuth } from '@/hooks/useAuth';
import { messageService, MessageWithUser } from '@/services/message.service';
import { communityService, CommunityModel, getCommunityId } from '@/services/community.service';
import Toast from 'react-native-toast-message';

// Default community for the main Sikkim Tourism chat
const DEFAULT_COMMUNITY_NAME = 'Sikkim Travelers';
const DEFAULT_COMMUNITY_DESC = 'Connect with fellow travelers exploring Sikkim';

export default function CommunityChatScreen() {
    const router = useRouter();
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const { user, isAuthenticated } = useAuth();
    
    const [messages, setMessages] = useState<MessageWithUser[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [inputFocused, setInputFocused] = useState(false);
    const [showCursor, setShowCursor] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [onlineCount, setOnlineCount] = useState(0);
    const [communityId, setCommunityId] = useState<string | null>(null);
    const [community, setCommunity] = useState<CommunityModel | null>(null);
    
    const scrollViewRef = useRef<ScrollView>(null);

    // Theme colors
    const screenBg = useThemeColor('background');
    const cardBg = useThemeColor('card');
    const text = useThemeColor('text');
    const mutedText = useThemeColor('mutedText');
    const tint = useThemeColor('tint');
    const border = useThemeColor('border');
    
    // Muted message bubble color for better readability
    const messageBubbleColor = tint === '#64D2FF' ? '#0B7FA6' : tint;
    
    // Track if community initialization is in progress to prevent duplicates
    const initializingRef = useRef(false);

    // Initialize or get the default community
    const initializeCommunity = useCallback(async () => {
        // Prevent duplicate initialization
        if (initializingRef.current || communityId) return;
        initializingRef.current = true;
        
        try {
            // Try to get existing communities
            const response = await communityService.list({ skip: 0, limit: 10 });
            if (response.success && response.data && response.data.length > 0) {
                // Find the Sikkim Travelers community or use the first one
                const sikkimCommunity = response.data.find(c => c.name === DEFAULT_COMMUNITY_NAME);
                if (sikkimCommunity) {
                    setCommunityId(getCommunityId(sikkimCommunity));
                    setCommunity(sikkimCommunity);
                } else {
                    const firstCommunity = response.data[0];
                    setCommunityId(getCommunityId(firstCommunity));
                    setCommunity(firstCommunity);
                }
            } else {
                // Create default community if none exists
                const createResponse = await communityService.create({
                    name: DEFAULT_COMMUNITY_NAME,
                    decription: DEFAULT_COMMUNITY_DESC,
                });
                if (createResponse.success && createResponse.data) {
                    const newCommunity = createResponse.data;
                    setCommunityId(getCommunityId(newCommunity));
                    setCommunity(newCommunity);
                }
            }
        } catch (error) {
            console.error('Error initializing community:', error);
            Toast.show({
                type: 'error',
                text1: t.error || 'Error',
                text2: t.failedToLoadChat || 'Failed to load chat',
            });
        } finally {
            initializingRef.current = false;
        }
    }, [communityId, t]);

    // Use ref to store communityId for polling to avoid stale closures
    const communityIdRef = useRef<string | null>(null);
    useEffect(() => {
        communityIdRef.current = communityId;
    }, [communityId]);

    // Load messages - use ref for communityId to avoid stale closure in interval
    const loadMessages = useCallback(async (showLoader = true) => {
        const cid = communityIdRef.current;
        if (!cid) return;
        
        if (showLoader) setLoading(true);
        try {
            const response = await messageService.getChatMessages(cid, { limit: 100 });
            if (response.success && response.data) {
                setMessages(prevMessages => {
                    // Only update if messages actually changed (compare by length and last message id)
                    const newMessages = response.data!;
                    if (prevMessages.length !== newMessages.length || 
                        (newMessages.length > 0 && prevMessages.length > 0 && 
                         prevMessages[prevMessages.length - 1]?.id !== newMessages[newMessages.length - 1]?.id)) {
                        // Scroll to bottom when new messages arrive
                        setTimeout(() => {
                            scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 100);
                        return newMessages;
                    }
                    return prevMessages;
                });
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []); // No dependencies - uses ref

    // Load online count
    const loadOnlineCount = useCallback(async () => {
        const cid = communityIdRef.current;
        if (!cid) return;
        try {
            const response = await messageService.getOnlineCount(cid);
            if (response.success && response.data) {
                // Add some base count for better UX
                setOnlineCount(Math.max(response.data.online_count, 1) + Math.floor(Math.random() * 10) + 5);
            }
        } catch (error) {
            console.error('Error loading online count:', error);
        }
    }, []); // No dependencies - uses ref

    // Initialize community on mount - only run once
    useEffect(() => {
        if (isAuthenticated && !communityId && !initializingRef.current) {
            initializeCommunity();
        }
    }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

    // Load messages when community is set and start polling
    useEffect(() => {
        if (!communityId) return;
        
        // Initial load
        loadMessages();
        loadOnlineCount();
        
        // Poll for new messages every 3 seconds for more real-time feel
        const interval = setInterval(() => {
            loadMessages(false);
        }, 3000);
        
        // Poll online count less frequently (every 10 seconds)
        const onlineInterval = setInterval(() => {
            loadOnlineCount();
        }, 10000);
        
        return () => {
            clearInterval(interval);
            clearInterval(onlineInterval);
        };
    }, [communityId, loadMessages, loadOnlineCount]);

    // Blinking cursor timer when input is empty
    useEffect(() => {
        let timer: any = null;
        if (!inputMessage) {
            timer = setInterval(() => setShowCursor(s => !s), 500);
        } else {
            setShowCursor(true);
        }
        return () => clearInterval(timer);
    }, [inputMessage]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || !communityId || sending) return;
        
        const messageText = inputMessage.trim();
        setInputMessage('');
        setSending(true);
        
        try {
            const response = await messageService.create({
                cid: communityId,
                text: messageText,
            });
            
            if (response.success && response.data) {
                setMessages(prev => [...prev, response.data!]);
                setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 100);
            } else {
                // Check if it's a profanity error
                const errorMsg = response.errors?.[0] || (t.failedToSend || 'Failed to send message');
                const isProfanityError = errorMsg.toLowerCase().includes('inappropriate') || 
                                        errorMsg.toLowerCase().includes('respectful');
                
                Toast.show({
                    type: 'error',
                    text1: isProfanityError ? (t.messageBlocked || 'Message Blocked') : (t.error || 'Error'),
                    text2: errorMsg,
                    visibilityTime: 4000,
                });
                
                // Only restore message if it's not a profanity error
                if (!isProfanityError) {
                    setInputMessage(messageText);
                }
            }
        } catch (error: any) {
            console.error('Error sending message:', error);
            
            // Extract error message from response
            const errorMsg = error?.response?.data?.detail || error?.message || (t.failedToSend || 'Failed to send message');
            const isProfanityError = errorMsg.toLowerCase().includes('inappropriate') || 
                                    errorMsg.toLowerCase().includes('respectful');
            
            Toast.show({
                type: 'error',
                text1: isProfanityError ? (t.messageBlocked || 'Message Blocked') : (t.error || 'Error'),
                text2: errorMsg,
                visibilityTime: 4000,
            });
            
            // Only restore message if it's not a profanity error
            if (!isProfanityError) {
                setInputMessage(messageText);
            }
        } finally {
            setSending(false);
        }
    };

    const handleFlagMessage = async (messageId: string) => {
        Alert.alert(
            t.reportMessage || 'Report Message',
            t.reportMessageConfirm || 'Are you sure you want to report this message for review?',
            [
                { text: t.cancel || 'Cancel', style: 'cancel' },
                {
                    text: t.report || 'Report',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await messageService.flagMessage(messageId);
                            if (response.success) {
                                Toast.show({
                                    type: 'success',
                                    text1: t.reported || 'Reported',
                                    text2: t.messageReported || 'Message has been reported for review',
                                });
                                loadMessages(false);
                            }
                        } catch (error) {
                            Toast.show({
                                type: 'error',
                                text1: t.error || 'Error',
                                text2: t.failedToReport || 'Failed to report message',
                            });
                        }
                    },
                },
            ]
        );
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadMessages();
    };

    const formatTime = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const isCurrentUser = (uid: string) => {
        return user?.id === uid || (user as any)?._id === uid;
    };

    if (!isAuthenticated) {
        return (
            <View style={[styles.container, styles.centerContent, { backgroundColor: screenBg }]}>
                <IconSymbol name="person.crop.circle.badge.exclamationmark" size={64} color={mutedText as string} />
                <Text style={[styles.emptyText, { color: text }]}>{t.loginRequired || 'Login Required'}</Text>
                <Text style={[styles.emptySubtext, { color: mutedText }]}>{t.loginToChat || 'Please login to access community chat'}</Text>
                <TouchableOpacity 
                    style={[styles.loginButton, { backgroundColor: tint }]}
                    onPress={() => router.push('/(auth)/login' as any)}
                >
                    <Text style={styles.loginButtonText}>{t.login || 'Login'}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: screenBg }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: border }]}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.push('/(user)/home' as any)}
                >
                    <IconSymbol name="chevron.left" size={24} color={text as string} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: text }]}>
                        {community?.name || (t.communityChat || 'Community Chat')}
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: mutedText }]}>
                        {community?.decription || (t.connectTravelers || 'Connect with fellow travelers')}
                    </Text>
                </View>
                <View style={styles.onlineIndicator}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.onlineText}>{onlineCount}</Text>
                </View>
            </View>

            {/* Messages */}
            {loading ? (
                <View style={[styles.container, styles.centerContent]}>
                    <ActivityIndicator size="large" color={tint as string} />
                    <Text style={[styles.loadingText, { color: mutedText }]}>{t.loadingMessages || 'Loading messages...'}</Text>
                </View>
            ) : (
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={tint as string} />
                    }
                >
                    {messages.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <IconSymbol name="bubble.left.and.bubble.right" size={48} color={mutedText as string} />
                            <Text style={[styles.emptyText, { color: text }]}>{t.noMessages || 'No messages yet'}</Text>
                            <Text style={[styles.emptySubtext, { color: mutedText }]}>{t.startConversation || 'Be the first to start the conversation!'}</Text>
                        </View>
                    ) : (
                        messages.map((message) => {
                            const isMine = isCurrentUser(message.uid);
                            return (
                                <TouchableOpacity
                                    key={message.id}
                                    style={[
                                        styles.messageWrapper,
                                        isMine && styles.messageWrapperRight,
                                    ]}
                                    onLongPress={() => !isMine && handleFlagMessage(message.id)}
                                    delayLongPress={500}
                                    activeOpacity={0.8}
                                >
                                    {!isMine && (
                                        <View style={[styles.avatar, { backgroundColor: tint }]}>
                                            <Text style={styles.avatarText}>{message.user_avatar || '?'}</Text>
                                        </View>
                                    )}
                                    <View
                                        style={[
                                            styles.messageBubble,
                                            isMine 
                                                ? { backgroundColor: messageBubbleColor, borderBottomRightRadius: 4 } 
                                                : { backgroundColor: cardBg, borderBottomLeftRadius: 4 },
                                            message.status === 'flagged' && styles.flaggedMessage,
                                        ]}
                                    >
                                        {!isMine && (
                                            <Text style={[styles.userName, { color: tint }]}>{message.user_name}</Text>
                                        )}
                                        <Text
                                            style={[
                                                styles.messageText,
                                                { color: isMine ? '#fff' : text },
                                            ]}
                                        >
                                            {message.text}
                                        </Text>
                                        <View style={styles.messageFooter}>
                                            <Text
                                                style={[
                                                    styles.timestamp,
                                                    { color: isMine ? 'rgba(255, 255, 255, 0.7)' : mutedText },
                                                ]}
                                            >
                                                {formatTime(message.created_at)}
                                            </Text>
                                            {message.status === 'flagged' && (
                                                <IconSymbol name="flag.fill" size={12} color="#f59e0b" />
                                            )}
                                        </View>
                                    </View>
                                    {isMine && (
                                        <View style={[styles.avatar, styles.avatarUser]}>
                                            <Text style={styles.avatarText}>
                                                {user?.name?.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase() || 'ME'}
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })
                    )}
                </ScrollView>
            )}

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                style={[styles.keyboardAvoid, { backgroundColor: cardBg }]}
            >
                <View style={[styles.inputContainer, { backgroundColor: cardBg, borderTopColor: border }]}>
                    <View style={{ flex: 1, position: 'relative' }}>
                        {/* Blinking caret when input is empty to indicate placeholder focus */}
                        {(!inputMessage) && (
                            <View pointerEvents="none" style={{ position: 'absolute', left: 18, top: 12 }}>
                                <View style={{ width: 2, height: 20, backgroundColor: tint, opacity: showCursor ? 1 : 0 }} />
                            </View>
                        )}
                        <TextInput
                            style={[styles.input, { color: text, backgroundColor: screenBg }]}
                            placeholder={t.typeMessage || 'Type a message...'}
                            placeholderTextColor={mutedText as string}
                            value={inputMessage}
                            onChangeText={setInputMessage}
                            multiline
                            maxLength={500}
                            editable={!sending}
                            onFocus={() => {
                                setInputFocused(true);
                                setTimeout(() => {
                                    scrollViewRef.current?.scrollToEnd({ animated: true });
                                }, 100);
                            }}
                            onBlur={() => setInputFocused(false)}
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.sendButton, (inputMessage.trim() && !sending) && styles.sendButtonActive]}
                        onPress={handleSendMessage}
                        disabled={!inputMessage.trim() || sending}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color={tint as string} />
                        ) : (
                            <IconSymbol
                                name="arrow.up.circle.fill"
                                size={32}
                                color={(inputMessage.trim() && !sending) ? (tint as string) : (border as string)}
                            />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
    onlineIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dcfce7',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10b981',
    },
    onlineText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#10b981',
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
        paddingBottom: 20,
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    loginButton: {
        marginTop: 20,
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    messageWrapper: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-end',
        gap: 8,
    },
    messageWrapperRight: {
        flexDirection: 'row-reverse',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarUser: {
        backgroundColor: '#10b981',
    },
    avatarText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    messageBubble: {
        maxWidth: '70%',
        borderRadius: 16,
        padding: 12,
    },
    flaggedMessage: {
        borderWidth: 1,
        borderColor: '#f59e0b',
    },
    userName: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    timestamp: {
        fontSize: 11,
    },
    keyboardAvoid: {
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        paddingBottom: 32,
        borderTopWidth: 1,
        gap: 8,
    },
    input: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        maxHeight: 100,
    },
    sendButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonActive: {
        // Active state styling handled by icon color
    },
});
