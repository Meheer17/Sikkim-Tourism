import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Platform } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ttsService, SupportedLanguage } from '@/services/tts.service';

interface LanguageSelectorProps {
    onLanguageChange?: (languageCode: string) => void;
    style?: any;
}

export default function LanguageSelector({ onLanguageChange, style }: LanguageSelectorProps) {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(
        ttsService.supportedLanguages[0]
    );

    const handleLanguageSelect = (language: SupportedLanguage) => {
        setSelectedLanguage(language);
        ttsService.setCurrentLanguage(language.code);
        setModalVisible(false);
        onLanguageChange?.(language.code);
    };

    return (
        <View style={[styles.container, style]}>
            <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setModalVisible(true)}
            >
                <IconSymbol name="globe" size={20} color="#0a7ea4" />
                <Text style={styles.selectedLanguageText} numberOfLines={1}>
                    {selectedLanguage.nativeName}
                </Text>
                <IconSymbol name="chevron.down" size={16} color="#687076" />
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Language</Text>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <IconSymbol name="xmark" size={24} color="#687076" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.languageList}>
                            {ttsService.supportedLanguages.map((language) => (
                                <TouchableOpacity
                                    key={language.code}
                                    style={[
                                        styles.languageItem,
                                        selectedLanguage.code === language.code && styles.languageItemSelected,
                                    ]}
                                    onPress={() => handleLanguageSelect(language)}
                                >
                                    <View style={styles.languageInfo}>
                                        <Text style={styles.languageNativeName}>
                                            {language.nativeName}
                                        </Text>
                                        <Text style={styles.languageEnglishName}>
                                            {language.name}
                                        </Text>
                                    </View>
                                    {selectedLanguage.code === language.code && (
                                        <IconSymbol name="checkmark" size={24} color="#0a7ea4" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <Text style={styles.footerNote}>
                                💡 Language availability depends on your device's TTS support
                            </Text>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        zIndex: 100,
    },
    selectorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    selectedLanguageText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#11181C',
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#11181C',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    languageList: {
        maxHeight: 500,
    },
    languageItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    languageItemSelected: {
        backgroundColor: '#f0f9ff',
    },
    languageInfo: {
        flex: 1,
    },
    languageNativeName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#11181C',
        marginBottom: 2,
    },
    languageEnglishName: {
        fontSize: 13,
        color: '#687076',
    },
    modalFooter: {
        paddingHorizontal: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    footerNote: {
        fontSize: 12,
        color: '#687076',
        textAlign: 'center',
        lineHeight: 18,
    },
});
