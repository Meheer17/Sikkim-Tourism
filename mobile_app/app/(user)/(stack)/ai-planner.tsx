import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

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

// Mock questions from server
const MOCK_QUESTIONS: Question[] = [
    {
        id: '1',
        question: 'What type of traveler are you?',
        type: 'single',
        options: ['Adventure Seeker', 'Culture Enthusiast', 'Nature Lover', 'Relaxation Focused', 'Photography Buff'],
    },
    {
        id: '2',
        question: 'What is your preferred travel duration?',
        type: 'single',
        options: ['1-2 days', '3-5 days', '1 week', '2 weeks', 'Flexible'],
    },
    {
        id: '3',
        question: 'What is your budget range?',
        type: 'single',
        options: ['Budget (₹5k-15k)', 'Moderate (₹15k-30k)', 'Comfortable (₹30k-50k)', 'Luxury (₹50k+)'],
    },
    {
        id: '4',
        question: 'Which activities interest you? (Select multiple)',
        type: 'multiple',
        options: ['Trekking', 'Monastery Visits', 'River Rafting', 'Cable Car Rides', 'Local Cuisine', 'Shopping', 'Photography'],
    },
    {
        id: '5',
        question: 'What is your preferred accommodation?',
        type: 'single',
        options: ['Budget Hotels', 'Mid-range Hotels', 'Luxury Resorts', 'Homestays', 'No Preference'],
    },
    {
        id: '6',
        question: 'When do you plan to travel?',
        type: 'single',
        options: ['This Month', 'Next Month', 'Next 3 Months', 'Next 6 Months', 'Not Sure Yet'],
    },
    {
        id: '7',
        question: 'Who are you traveling with?',
        type: 'single',
        options: ['Solo', 'Partner/Spouse', 'Family', 'Friends', 'Group Tour'],
    },
];

export default function AIPlanner() {
    const router = useRouter();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [progressAnimation] = useState(new Animated.Value(0));

    const currentQuestion = MOCK_QUESTIONS[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / MOCK_QUESTIONS.length) * 100;

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
        if (currentQuestionIndex < MOCK_QUESTIONS.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            Animated.timing(progressAnimation, {
                toValue: ((currentQuestionIndex + 2) / MOCK_QUESTIONS.length) * 100,
                duration: 300,
                useNativeDriver: false,
            }).start();
        } else {
            // Navigate to results
            router.push({
                pathname: '/(user)/(stack)/ai-planner-results' as any,
                params: { answers: JSON.stringify(answers) },
            });
        }
    };

    const handleBack = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
            Animated.timing(progressAnimation, {
                toValue: (currentQuestionIndex / MOCK_QUESTIONS.length) * 100,
                duration: 300,
                useNativeDriver: false,
            }).start();
        } else {
            router.back();
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <IconSymbol name="chevron.left" size={24} color="#11181C" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>AI Travel Planner</Text>
                    <Text style={styles.headerSubtitle}>
                        Question {currentQuestionIndex + 1} of {MOCK_QUESTIONS.length}
                    </Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                    <IconSymbol name="xmark" size={24} color="#687076" />
                </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{Math.round(progress)}% Complete</Text>
            </View>

            {/* Question Content */}
            <ScrollView 
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.questionCard}>
                    <View style={styles.questionIconContainer}>
                        <IconSymbol name="sparkles" size={32} color="#667eea" />
                    </View>
                    <Text style={styles.questionText}>{currentQuestion.question}</Text>
                    {currentQuestion.type === 'multiple' && (
                        <Text style={styles.multipleHint}>Select all that apply</Text>
                    )}
                </View>

                {/* Options */}
                <View style={styles.optionsContainer}>
                    {currentQuestion.options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.optionButton,
                                isOptionSelected(option) && styles.optionButtonSelected,
                            ]}
                            onPress={() => handleOptionSelect(option)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.optionContent}>
                                <Text
                                    style={[
                                        styles.optionText,
                                        isOptionSelected(option) && styles.optionTextSelected,
                                    ]}
                                >
                                    {option}
                                </Text>
                                {isOptionSelected(option) && (
                                    <View style={styles.checkmark}>
                                        <IconSymbol name="checkmark" size={16} color="#fff" />
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Navigation Button */}
                <TouchableOpacity
                    style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
                    onPress={handleNext}
                    disabled={!canProceed()}
                >
                    <Text style={styles.nextButtonText}>
                        {currentQuestionIndex === MOCK_QUESTIONS.length - 1 ? 'Get Recommendations' : 'Next Question'}
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
});
