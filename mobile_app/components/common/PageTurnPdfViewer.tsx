import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Animated,
    PanResponder,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface PageTurnPdfViewerProps {
    visible: boolean;
    pdfUrl: string;
    fileName?: string;
    onClose: () => void;
}

export const PageTurnPdfViewer: React.FC<PageTurnPdfViewerProps> = ({
    visible,
    pdfUrl,
    fileName,
    onClose,
}) => {
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const tint = useThemeColor('tint');
    const border = useThemeColor('border');

    // Page turn animation
    const pageRotation = useRef(new Animated.Value(0)).current;
    const pageOpacity = useRef(new Animated.Value(1)).current;

    const animatePageTurn = (direction: 'next' | 'prev') => {
        // Create page-flip effect
        Animated.sequence([
            Animated.parallel([
                Animated.timing(pageRotation, {
                    toValue: direction === 'next' ? -15 : 15,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(pageOpacity, {
                    toValue: 0.3,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]),
            Animated.parallel([
                Animated.timing(pageRotation, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(pageOpacity, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            animatePageTurn('next');
            setTimeout(() => setCurrentPage(prev => prev + 1), 150);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            animatePageTurn('prev');
            setTimeout(() => setCurrentPage(prev => prev - 1), 150);
        }
    };

    // Swipe gesture handler
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > 10;
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx > 50) {
                    // Swipe right - previous page
                    handlePrevPage();
                } else if (gestureState.dx < -50) {
                    // Swipe left - next page
                    handleNextPage();
                }
            },
        })
    ).current;

    // Build viewer URL with page support
    const viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}#page=${currentPage}`;

    const handleWebViewMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'pageCount') {
                setTotalPages(data.count);
            }
        } catch (error) {
            console.log('WebView message error:', error);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={[styles.container, { backgroundColor: background }]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: card, borderBottomColor: border }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <IconSymbol name="xmark" size={24} color={text} />
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                        <Text style={[styles.fileName, { color: text }]} numberOfLines={1}>
                            {fileName || 'Document'}
                        </Text>
                        <Text style={[styles.pageInfo, { color: text }]}>
                            Page {currentPage} of {totalPages}
                        </Text>
                    </View>
                    <View style={styles.placeholder} />
                </View>

                {/* PDF Content with Animation */}
                <Animated.View
                    style={[
                        styles.contentContainer,
                        {
                            opacity: pageOpacity,
                            transform: [
                                {
                                    perspective: 1000,
                                },
                                {
                                    rotateY: pageRotation.interpolate({
                                        inputRange: [-15, 0, 15],
                                        outputRange: ['-15deg', '0deg', '15deg'],
                                    }),
                                },
                            ],
                        },
                    ]}
                    {...panResponder.panHandlers}
                >
                    <View style={[styles.pageContainer, { backgroundColor: '#fff' }]}>
                        {/* Paper texture overlay */}
                        <View style={styles.paperTexture} />
                        
                        <WebView
                            source={{ uri: viewerUrl }}
                            style={styles.webview}
                            onLoadStart={() => setLoading(true)}
                            onLoadEnd={() => setLoading(false)}
                            onMessage={handleWebViewMessage}
                            javaScriptEnabled
                            domStorageEnabled
                            startInLoadingState
                            scalesPageToFit
                        />
                        
                        {loading && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="large" color={tint} />
                                <Text style={[styles.loadingText, { color: text }]}>
                                    Loading page...
                                </Text>
                            </View>
                        )}

                        {/* Page curl shadow effect */}
                        <View style={styles.pageCurlShadow} />
                    </View>
                </Animated.View>

                {/* Navigation Controls */}
                <View style={[styles.controls, { backgroundColor: card, borderTopColor: border }]}>
                    <TouchableOpacity
                        style={[
                            styles.navButton,
                            { backgroundColor: currentPage === 1 ? '#e5e7eb' : tint },
                        ]}
                        onPress={handlePrevPage}
                        disabled={currentPage === 1}
                    >
                        <IconSymbol
                            name="chevron.left"
                            size={24}
                            color={currentPage === 1 ? '#9ca3af' : '#fff'}
                        />
                        <Text
                            style={[
                                styles.navButtonText,
                                { color: currentPage === 1 ? '#9ca3af' : '#fff' },
                            ]}
                        >
                            Previous
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.pageIndicator}>
                        <TouchableOpacity
                            style={[styles.pageNumberButton, { backgroundColor: card, borderColor: border }]}
                        >
                            <Text style={[styles.pageNumberText, { color: text }]}>
                                {currentPage}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.navButton,
                            { backgroundColor: currentPage === totalPages ? '#e5e7eb' : tint },
                        ]}
                        onPress={handleNextPage}
                        disabled={currentPage === totalPages}
                    >
                        <Text
                            style={[
                                styles.navButtonText,
                                { color: currentPage === totalPages ? '#9ca3af' : '#fff' },
                            ]}
                        >
                            Next
                        </Text>
                        <IconSymbol
                            name="chevron.right"
                            size={24}
                            color={currentPage === totalPages ? '#9ca3af' : '#fff'}
                        />
                    </TouchableOpacity>
                </View>

                {/* Swipe instruction hint */}
                {currentPage === 1 && totalPages > 1 && (
                    <View style={styles.swipeHint}>
                        <Text style={[styles.swipeHintText, { color: text }]}>
                            👈 Swipe to turn pages 👉
                        </Text>
                    </View>
                )}
            </View>
        </Modal>
    );
};

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
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContent: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 16,
    },
    fileName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    pageInfo: {
        fontSize: 14,
        opacity: 0.7,
    },
    placeholder: {
        width: 40,
    },
    contentContainer: {
        flex: 1,
        margin: 16,
        borderRadius: 12,
        overflow: 'hidden',
        // 3D effect
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    pageContainer: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    paperTexture: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 250, 240, 0.3)',
        zIndex: 1,
        pointerEvents: 'none',
    },
    pageCurlShadow: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 30,
        height: '100%',
        backgroundColor: 'transparent',
        borderRightWidth: 1,
        borderRightColor: 'rgba(0, 0, 0, 0.1)',
        pointerEvents: 'none',
    },
    webview: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderTopWidth: 1,
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        minWidth: 120,
        justifyContent: 'center',
    },
    navButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    pageIndicator: {
        alignItems: 'center',
    },
    pageNumberButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pageNumberText: {
        fontSize: 18,
        fontWeight: '700',
    },
    swipeHint: {
        position: 'absolute',
        bottom: 100,
        left: 0,
        right: 0,
        alignItems: 'center',
        pointerEvents: 'none',
    },
    swipeHintText: {
        fontSize: 14,
        fontWeight: '500',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        overflow: 'hidden',
    },
});
