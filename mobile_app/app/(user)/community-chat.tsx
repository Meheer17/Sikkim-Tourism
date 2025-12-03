import { IconSymbol } from '@/components/ui/icon-symbol';
import { getLanguageTranslations } from '@/constants/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Mock chat messages
interface ChatMessage {
    id: string;
    userName: string;
    userAvatar: string;
    message: string;
    timestamp: string;
    isCurrentUser: boolean;
}

const MOCK_MESSAGES: ChatMessage[] = [
    {
        id: '1',
        userName: 'Rajesh Kumar',
        userAvatar: 'RK',
        message: 'Hey everyone! Just visited Tsomgo Lake, absolutely breathtaking! 🏔️',
        timestamp: '10:30 AM',
        isCurrentUser: false,
    },
    {
        id: '2',
        userName: 'Priya Sharma',
        userAvatar: 'PS',
        message: 'That sounds amazing! How was the weather?',
        timestamp: '10:32 AM',
        isCurrentUser: false,
    },
    {
        id: '3',
        userName: 'You',
        userAvatar: 'ME',
        message: 'I\'m planning to visit next week. Any tips?',
        timestamp: '10:35 AM',
        isCurrentUser: true,
    },
    {
        id: '4',
        userName: 'Rajesh Kumar',
        userAvatar: 'RK',
        message: 'Definitely carry warm clothes! It gets really cold up there. Also, book a permit in advance.',
        timestamp: '10:37 AM',
        isCurrentUser: false,
    },
    {
        id: '5',
        userName: 'Amit Patel',
        userAvatar: 'AP',
        message: 'Anyone tried the local momos near MG Marg? They\'re incredible! 🥟',
        timestamp: '10:40 AM',
        isCurrentUser: false,
    },
    {
        id: '6',
        userName: 'Sneha Desai',
        userAvatar: 'SD',
        message: 'Yes! The place near the taxi stand? Love that spot!',
        timestamp: '10:42 AM',
        isCurrentUser: false,
    },
    {
        id: '7',
        userName: 'You',
        userAvatar: 'ME',
        message: 'Thanks for the recommendations! Really helpful 😊',
        timestamp: '10:45 AM',
        isCurrentUser: true,
    },
];

export default function CommunityChatScreen() {
    const router = useRouter();
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
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
                    <Text style={[styles.headerTitle, { color: text }]}>{t.community}</Text>
                    <Text style={[styles.headerSubtitle, { color: mutedText }]}>{t.chat}</Text>
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
                        placeholder={t.typeMessage}
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
