import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

interface ChatMessage {
    id: string;
    userName: string;
    userAvatar: string;
    message: string;
    timestamp: string;
    isCurrentUser: boolean;
}

export default function CommunityChatScreen() {
    const router = useRouter();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const scrollViewRef = useRef<ScrollView>(null);

    // Theme colors
    const screenBg = useThemeColor('background');
    const cardBg = useThemeColor('card');
    const text = useThemeColor('text');
    const mutedText = useThemeColor('mutedText');
    const tint = useThemeColor('tint');
    const border = useThemeColor('border');
    
    // Muted message bubble color for better readability
    const messageBubbleColor = tint === '#64D2FF' ? '#0B7FA6' : tint; // Darker blue for dark mode

    const handleSendMessage = () => {
        if (inputMessage.trim()) {
            const newMessage: ChatMessage = {
                id: Date.now().toString(),
                userName: 'You',
                userAvatar: 'ME',
                message: inputMessage.trim(),
                timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                isCurrentUser: true,
            };
            setMessages([...messages, newMessage]);
            setInputMessage('');
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    };

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
                    <Text style={[styles.headerTitle, { color: text }]}>Community Chat</Text>
                    <Text style={[styles.headerSubtitle, { color: mutedText }]}>Connect with fellow travelers</Text>
                </View>
                <View style={styles.onlineIndicator}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.onlineText}>124</Text>
                </View>
            </View>

            {/* Messages */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
            >
                {messages.map((message) => (
                    <View
                        key={message.id}
                        style={[
                            styles.messageWrapper,
                            message.isCurrentUser && styles.messageWrapperRight,
                        ]}
                    >
                        {!message.isCurrentUser && (
                            <View style={[styles.avatar, { backgroundColor: tint }]}>
                                <Text style={styles.avatarText}>{message.userAvatar}</Text>
                            </View>
                        )}
                        <View
                            style={[
                                styles.messageBubble,
                                message.isCurrentUser 
                                    ? { backgroundColor: messageBubbleColor, borderBottomRightRadius: 4 } 
                                    : { backgroundColor: cardBg, borderBottomLeftRadius: 4 },
                            ]}
                        >
                            {!message.isCurrentUser && (
                                <Text style={[styles.userName, { color: tint }]}>{message.userName}</Text>
                            )}
                            <Text
                                style={[
                                    styles.messageText,
                                    { color: message.isCurrentUser ? '#fff' : text },
                                ]}
                            >
                                {message.message}
                            </Text>
                            <Text
                                style={[
                                    styles.timestamp,
                                    { color: message.isCurrentUser ? 'rgba(255, 255, 255, 0.7)' : mutedText },
                                ]}
                            >
                                {message.timestamp}
                            </Text>
                        </View>
                        {message.isCurrentUser && (
                            <View style={[styles.avatar, styles.avatarUser]}>
                                <Text style={styles.avatarText}>{message.userAvatar}</Text>
                            </View>
                        )}
                    </View>
                ))}
            </ScrollView>

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                style={[styles.keyboardAvoid, { backgroundColor: cardBg }]}
            >
                <View style={[styles.inputContainer, { backgroundColor: cardBg, borderTopColor: border }]}>
                    <TouchableOpacity style={styles.attachButton}>
                        <IconSymbol name="paperclip" size={24} color={mutedText as string} />
                    </TouchableOpacity>
                    <TextInput
                        style={[styles.input, { color: text, backgroundColor: screenBg }]}
                        placeholder="Type a message..."
                        placeholderTextColor={mutedText as string}
                        value={inputMessage}
                        onChangeText={setInputMessage}
                        multiline
                        maxLength={500}
                        onFocus={() => {
                            setTimeout(() => {
                                scrollViewRef.current?.scrollToEnd({ animated: true });
                            }, 100);
                        }}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, inputMessage.trim() && styles.sendButtonActive]}
                        onPress={handleSendMessage}
                        disabled={!inputMessage.trim()}
                    >
                        <IconSymbol
                            name="arrow.up.circle.fill"
                            size={32}
                            color={inputMessage.trim() ? (tint as string) : (border as string)}
                        />
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
    userName: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    timestamp: {
        fontSize: 11,
        marginTop: 4,
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
    attachButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
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
