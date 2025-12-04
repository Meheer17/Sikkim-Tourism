import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { communityService } from '@/services/community.service';
import { messageService } from '@/services/message.service';

interface Community {
    _id: string;
    name: string;
    decription: string; // backend typo kept
    created_at?: string;
    updated_at?: string;
}

interface Message {
    _id: string;
    uid: string;
    cid: string;
    text: string;
    created_at?: string;
}

export default function CommunityDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [community, setCommunity] = useState<Community | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    useEffect(() => {
        loadCommunityDetails();
    }, [id]);

    const loadCommunityDetails = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [commResp, msgResp] = await Promise.all([
                communityService.get(id),
                messageService.list({ cid: id, skip: 0, limit: 10 })
            ]);

            if (commResp.success && commResp.data) {
                setCommunity(commResp.data);
            }
            if (msgResp.success && msgResp.data) {
                setMessages(msgResp.data);
            }
        } catch (error) {
            console.error('Failed to load community:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: background }]}>
                <ActivityIndicator size="large" color={tint} />
            </View>
        );
    }

    if (!community) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: background }]}>
                <IconSymbol name="exclamationmark.triangle" size={48} color={muted} />
                <Text style={[styles.errorText, { color: text }]}>Community not found</Text>
                <TouchableOpacity style={[styles.button, { backgroundColor: tint }]} onPress={() => router.back()}>
                    <Text style={styles.buttonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: card }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={24} color={text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: text }]} numberOfLines={1}>
                    {community.name}
                </Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Community Info */}
                <View style={[styles.infoCard, { backgroundColor: card }]}>
                    <View style={styles.iconContainer}>
                        <IconSymbol name="person.3.fill" size={48} color={tint} />
                    </View>

                    <Text style={[styles.title, { color: text }]}>{community.name}</Text>
                    <Text style={[styles.description, { color: muted }]}>{community.decription}</Text>

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <IconSymbol name="calendar" size={16} color={muted} />
                            <Text style={[styles.metaText, { color: muted }]}>Created {community.created_at ? new Date(community.created_at).toLocaleDateString() : '—'}</Text>
                        </View>
                    </View>
                </View>

                {/* Recent Messages */}
                <View style={styles.messagesSection}>
                    <Text style={[styles.sectionTitle, { color: text }]}>Recent Messages</Text>
                    {messages.length > 0 ? (
                        messages.map((msg) => (
                            <View key={msg._id} style={[styles.messageCard, { backgroundColor: card }]}>
                                <Text style={[styles.messageText, { color: text }]}>{msg.text}</Text>
                                <Text style={[styles.messageDate, { color: muted }]}>{msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}</Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyMessages}>
                            <IconSymbol name="bubble.left" size={32} color={muted} />
                            <Text style={[styles.emptyText, { color: muted }]}>No messages yet</Text>
                        </View>
                    )}
                </View>

                {/* Actions */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: tint }]}
                        onPress={() => router.push(`/(user)/community-chat?id=${id}` as any)}
                    >
                        <IconSymbol name="bubble.left.fill" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Open Chat</Text>
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
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
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
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 8,
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    infoCard: {
        margin: 16,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#e8f4f8',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 16,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 14,
    },
    messagesSection: {
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 12,
    },
    messageCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    messageText: {
        fontSize: 15,
        marginBottom: 8,
    },
    messageDate: {
        fontSize: 12,
    },
    emptyMessages: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 14,
        marginTop: 12,
    },
    actionsContainer: {
        paddingHorizontal: 16,
        paddingBottom: 32,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 24,
    },
    button: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
