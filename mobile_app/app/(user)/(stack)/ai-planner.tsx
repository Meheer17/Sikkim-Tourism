import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { aiPlannerService } from '@/services/ai-planner.service';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageTranslations } from '@/constants/translations';
import { useThemeColor } from '@/hooks/use-theme-color';

interface Question {
    id: string;
    question: string;
    type: 'single' | 'multiple';
    options: string[];
}

interface Answer {
    questionId: string;
    answer: string | string[];
}

export default function AIPlanner() {
    const router = useRouter();
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    
    // Theme colors
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const mutedText = useThemeColor('mutedText');
    const tint = useThemeColor('tint');
    const border = useThemeColor('border');
    
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [progressAnimation] = useState(new Animated.Value(0));
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadQuestions();
    }, []);

    const loadQuestions = async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedQuestions = await aiPlannerService.getQuestions();
            setQuestions(fetchedQuestions);
        } catch (err) {
            console.error('Error loading questions:', err);
            setError('Failed to load questions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Show loading state
    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: background }]}>
                <View style={[styles.header, { backgroundColor: card, borderBottomColor: border }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <IconSymbol name="chevron.left" size={24} color={text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: text }]}>{t.aiTravelPlanner || 'AI Travel Planner'}</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={tint} />
                    <Text style={[styles.loadingText, { color: text }]}>{t.loadingQuestions || 'Loading questions...'}</Text>
                </View>
            </View>
        );
    }

    // Show error state
    if (error || questions.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: background }]}>
                <View style={[styles.header, { backgroundColor: card, borderBottomColor: border }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <IconSymbol name="chevron.left" size={24} color={text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: text }]}>{t.aiTravelPlanner || 'AI Travel Planner'}</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.emptyContainer}>
                    <IconSymbol name="exclamationmark.triangle" size={64} color={mutedText} />
                    <Text style={[styles.emptyText, { color: text }]}>{error || t.noQuestionsAvailable || 'No questions available'}</Text>
                    <Text style={[styles.emptySubtext, { color: mutedText }]}>{t.checkBackLater || 'Please check back later'}</Text>
                    <TouchableOpacity style={[styles.retryButton, { backgroundColor: card, borderColor: border }]} onPress={loadQuestions}>
                        <IconSymbol name="arrow.clockwise" size={20} color={tint} />
                        <Text style={[styles.retryButtonText, { color: tint }]}>{t.retry || 'Retry'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    const handleOptionSelect = (option: string) => {
        const existingAnswerIndex = answers.findIndex(a => a.questionId === currentQuestion.id);

        if (currentQuestion.type === 'single') {
            const newAnswers = [...answers];
            if (existingAnswerIndex >= 0) {
                newAnswers[existingAnswerIndex] = {
                    questionId: currentQuestion.id,
                    answer: option,
                };
            } else {
                newAnswers.push({
                    questionId: currentQuestion.id,
                    answer: option,
                });
            }
            setAnswers(newAnswers);
        } else {
            // Multiple choice
            const newAnswers = [...answers];
            const existingAnswer = existingAnswerIndex >= 0
                ? newAnswers[existingAnswerIndex].answer as string[]
                : [];

            const optionIndex = existingAnswer.indexOf(option);
            let updatedAnswer: string[];

            if (optionIndex >= 0) {
                updatedAnswer = existingAnswer.filter(o => o !== option);
            } else {
                updatedAnswer = [...existingAnswer, option];
            }

            if (existingAnswerIndex >= 0) {
                newAnswers[existingAnswerIndex] = {
                    questionId: currentQuestion.id,
                    answer: updatedAnswer,
                };
            } else {
                newAnswers.push({
                    questionId: currentQuestion.id,
                    answer: updatedAnswer,
                });
            }
            setAnswers(newAnswers);
        }
    };

    const isOptionSelected = (option: string): boolean => {
        const answer = answers.find(a => a.questionId === currentQuestion.id);
        if (!answer) return false;

        if (currentQuestion.type === 'single') {
            return answer.answer === option;
        } else {
            return (answer.answer as string[]).includes(option);
        }
    };

    const canProceed = (): boolean => {
        const answer = answers.find(a => a.questionId === currentQuestion.id);
        if (!answer) return false;

        if (currentQuestion.type === 'multiple') {
            return (answer.answer as string[]).length > 0;
        }
        return true;
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            Animated.timing(progressAnimation, {
                toValue: ((currentQuestionIndex + 2) / questions.length) * 100,
                duration: 300,
                useNativeDriver: false,
            }).start();
        } else {
            // Navigate to results with answers
            const apiAnswers = answers.map(a => ({
                question_id: a.questionId,
                answer: a.answer
            }));
            
            router.push({
                pathname: '/(user)/(stack)/ai-planner-results' as any,
                params: { answers: JSON.stringify(apiAnswers) },
            });
        }
    };

    const handleBack = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
            Animated.timing(progressAnimation, {
                toValue: (currentQuestionIndex / questions.length) * 100,
                duration: 300,
                useNativeDriver: false,
            }).start();
        } else {
            router.back();
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: card, borderBottomColor: border }]}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <IconSymbol name="chevron.left" size={24} color={text} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerTitle, { color: text }]}>{t.aiTravelPlanner || 'AI Travel Planner'}</Text>
                    <Text style={[styles.headerSubtitle, { color: mutedText }]}>
                        {t.question || 'Question'} {currentQuestionIndex + 1} {t.of || 'of'} {questions.length}
                    </Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                    <IconSymbol name="xmark" size={24} color={mutedText} />
                </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <View style={[styles.progressContainer, { backgroundColor: card, borderBottomColor: border }]}>
                <View style={[styles.progressBar, { backgroundColor: border }]}>
                    <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: tint }]} />
                </View>
                <Text style={[styles.progressText, { color: tint }]}>{Math.round(progress)}% {t.complete || 'Complete'}</Text>
            </View>

            {/* Question Content */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.questionCard, { backgroundColor: card }]}>
                    <View style={[styles.questionIconContainer, { backgroundColor: background }]}>
                        <IconSymbol name="sparkles" size={32} color={tint} />
                    </View>
                    <Text style={[styles.questionText, { color: text }]}>{currentQuestion.question}</Text>
                    {currentQuestion.type === 'multiple' && (
                        <Text style={[styles.multipleHint, { color: tint }]}>{t.selectAllApply || 'Select all that apply'}</Text>
                    )}
                </View>

                {/* Options */}
                <View style={styles.optionsContainer}>
                    {currentQuestion.options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.optionButton,
                                { backgroundColor: card, borderColor: border },
                                isOptionSelected(option) && { borderColor: tint, backgroundColor: background },
                            ]}
                            onPress={() => handleOptionSelect(option)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.optionContent}>
                                <Text
                                    style={[
                                        styles.optionText,
                                        { color: text },
                                        isOptionSelected(option) && { color: tint },
                                    ]}
                                >
                                    {option}
                                </Text>
                                {isOptionSelected(option) && (
                                    <View style={[styles.checkmark, { backgroundColor: tint }]}>
                                        <IconSymbol name="checkmark" size={16} color="#fff" />
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Navigation Button */}
                <TouchableOpacity
                    style={[styles.nextButton, { backgroundColor: tint }, !canProceed() && styles.nextButtonDisabled]}
                    onPress={handleNext}
                    disabled={!canProceed()}
                >
                    <Text style={styles.nextButtonText}>
                        {currentQuestionIndex === questions.length - 1 ? (t.getRecommendations || 'Get Recommendations') : (t.nextQuestion || 'Next Question')}
                    </Text>
                    <IconSymbol name="arrow.right" size={20} color="#fff" />
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#11181C',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#687076',
        marginTop: 2,
    },
    closeButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#667eea',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#667eea',
        textAlign: 'center',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 120,
    },
    questionCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        alignItems: 'center',
    },
    questionIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    questionText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#11181C',
        textAlign: 'center',
        marginBottom: 8,
    },
    multipleHint: {
        fontSize: 14,
        color: '#667eea',
        fontWeight: '600',
    },
    optionsContainer: {
        gap: 12,
    },
    optionButton: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    optionButtonSelected: {
        borderColor: '#667eea',
        backgroundColor: '#f3f4f6',
    },
    optionContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#11181C',
        flex: 1,
    },
    optionTextSelected: {
        color: '#667eea',
    },
    checkmark: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    nextButton: {
        flexDirection: 'row',
        backgroundColor: '#667eea',
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 24,
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    nextButtonDisabled: {
        backgroundColor: '#d1d5db',
        elevation: 0,
        shadowOpacity: 0,
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#687076',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        fontSize: 16,
        color: '#687076',
        marginTop: 16,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#667eea',
    },
});
