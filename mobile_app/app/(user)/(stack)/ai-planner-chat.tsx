import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { aiChatService, ChatMessage, ChatResponse } from '@/services/ai-chat.service';
import { platformConfig } from '@/config/api.config';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageTranslations } from '@/constants/translations';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/hooks/useAuth';
import Toast from 'react-native-toast-message';

export default function AIPlannerChatScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const t = getLanguageTranslations(language);

  const { user } = useAuth();

  // If the logged in user is an admin, block access to AI planner
  useEffect(() => {
    if (user?.role === 'admin') {
      // Notify and navigate back — keep behavior minimal and non-destructive
      Toast.show({ type: 'info', text1: t.error || 'Notice', text2: t.aiDisabledForAdmin || 'AI suggestions are disabled for admin accounts.' });
      setTimeout(() => {
        router.back();
      }, 300);
    }
  }, [user]);

  // Theme colors
  const background = useThemeColor('background');
  const card = useThemeColor('card');
  const text = useThemeColor('text');
  const mutedText = useThemeColor('mutedText');
  const tint = useThemeColor('tint');
  const border = useThemeColor('border');

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isReadyToGenerate, setIsReadyToGenerate] = useState(false);
  const [extractedPreferences, setExtractedPreferences] = useState<Record<string, any>>({});

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Show initial greeting
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content:
          t.aiPlannerGreeting || "👋 Hi! I'm your Sikkim travel planning assistant. Tell me about your dream trip! For example:\n\n• I need a 3-day adventure trip\n• Planning a romantic honeymoon\n• Family vacation ideas for next month",
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    // Add user message to chat
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      let response: ChatResponse;

      if (!sessionId) {
        // Start new session
        response = await aiChatService.startChatSession(userMessage.content);
        setSessionId(response.session_id);
      } else {
        // Continue existing conversation
        response = await aiChatService.sendMessage(sessionId, userMessage.content);
      }

      // Add AI response to chat
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Update state
      setIsReadyToGenerate(response.is_complete);
      if (response.extracted_preferences) {
        setExtractedPreferences(response.extracted_preferences);
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content:
          t.aiChatError || '❌ Sorry, I encountered an error. Please try again or start a new conversation.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const generatePlans = async () => {
    if (!sessionId || !isReadyToGenerate) return;

    setIsLoading(true);
    setIsTyping(true);
    
    const loadingMessage: ChatMessage = {
      role: 'assistant',
      content: '🎨 Creating your personalized travel plans... This may take 10-15 seconds.',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      console.log('🚀 Generating plans for session:', sessionId);
      const travelPlans = await aiChatService.generatePlansFromChat(sessionId);
      console.log('✅ Plans generated successfully:', travelPlans);

      // Navigate to results with plans
      router.push({
        pathname: '/(user)/(stack)/ai-planner-results',
        params: {
          plans: JSON.stringify(travelPlans.plans),
          preferences: JSON.stringify(travelPlans.based_on_preferences),
        },
      });
    } catch (error: any) {
      console.error('❌ Failed to generate plans:', error);
      
      let errorText = '❌ Failed to generate travel plans. ';
      
      if (error.message?.includes('Network Error')) {
        errorText += 'Backend server is not running. Please start the backend server and try again.';
      } else if (error.response?.status === 404) {
        errorText += 'Session expired. Please start a new conversation.';
      } else if (error.response?.status === 500) {
        errorText += 'Server error. Please check backend logs for details.';
      } else {
        errorText += 'Please try again or start a new conversation.';
      }
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: errorText,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const resetChat = () => {
    setSessionId(null);
    setMessages([
      {
        role: 'assistant',
        content:
          t.aiPlannerResetGreeting || "👋 Let's start fresh! Tell me about your Sikkim travel plans.",
        timestamp: new Date().toISOString(),
      },
    ]);
    setIsReadyToGenerate(false);
    setExtractedPreferences({});
  };

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: tint }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.aiTravelPlanner || 'AI Travel Planner'}</Text>
        <TouchableOpacity onPress={resetChat} style={styles.resetButton}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 10}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
        >
        {messages.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              msg.role === 'user' ? [styles.userBubble, { backgroundColor: tint }] : [styles.assistantBubble, { backgroundColor: card, borderColor: border }],
            ]}
          >
            <Text
              style={[
                styles.messageText,
                msg.role === 'user' ? styles.userText : { color: text },
              ]}
            >
              {msg.content}
            </Text>
          </View>
        ))}

        {isTyping && (
          <View style={[styles.messageBubble, styles.assistantBubble, { backgroundColor: card, borderColor: border }]}>
            <Text style={[styles.typingText, { color: mutedText }]}>{t.aiTyping || 'AI is typing...'}</Text>
          </View>
        )}

        {/* Preferences Summary (when ready) */}
        {isReadyToGenerate && (
          <View style={[styles.preferencesSummary, { backgroundColor: card, borderColor: tint }]}>
            <Text style={[styles.preferencesTitle, { color: tint }]}>{t.readyToGenerate || '✅ Ready to generate plans!'}</Text>
            <Text style={[styles.preferencesText, { color: text }]}>
              {t.basedOnPreferences || 'Based on your preferences:'}
            </Text>
            {Object.entries(extractedPreferences).map(([key, value]) => {
              if (value && value !== null && (!Array.isArray(value) || value.length > 0)) {
                return (
                  <Text key={key} style={[styles.preferenceItem, { color: mutedText }]}>
                    • {key.replace(/_/g, ' ')}: {Array.isArray(value) ? value.join(', ') : String(value)}
                  </Text>
                );
              }
              return null;
            })}
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10), backgroundColor: card, borderTopColor: border }]}>
        {isReadyToGenerate ? (
          <TouchableOpacity
            style={[styles.generateButton, { backgroundColor: tint }, isLoading && styles.buttonDisabled]}
            onPress={generatePlans}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="#fff" />
                <Text style={styles.generateButtonText}>Show Plan</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <TextInput
              style={[styles.input, { backgroundColor: background, color: text }]}
              placeholder="Type your message..."
              placeholderTextColor={mutedText}
              value={inputMessage}
              onChangeText={setInputMessage}
              multiline
              maxLength={500}
              editable={!isLoading}
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: tint }, (!inputMessage.trim() || isLoading) && styles.buttonDisabled]}
              onPress={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0b8cb3ff',
    paddingTop: platformConfig.isIOS ? 20 : 60,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  resetButton: {
    padding: 5,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
    paddingBottom: 150,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#10b981',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  assistantText: {
    color: '#333',
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  preferencesSummary: {
    backgroundColor: '#e6f7f1',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  preferencesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1081b9ff',
    marginBottom: 8,
  },
  preferencesText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  preferenceItem: {
    fontSize: 13,
    color: '#555',
    marginLeft: 5,
    marginTop: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: '#1089b9ff',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButton: {
    flex: 1,
    backgroundColor: '#1094b9ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
