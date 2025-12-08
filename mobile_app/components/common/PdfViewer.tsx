import React, { useState } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
  Text,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PdfViewerProps {
  visible: boolean;
  pdfUrl: string;
  fileName?: string;
  onClose: () => void;
}

export function PdfViewer({ visible, pdfUrl, fileName, onClose }: PdfViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const background = useThemeColor('background');
  const text = useThemeColor('text');
  const tint = useThemeColor('tint');

  // Use Google Docs Viewer for PDF rendering with page-turning effect
  const viewerUrl = Platform.select({
    ios: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`,
    android: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`,
    default: pdfUrl,
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View style={[styles.container, { backgroundColor: background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: tint + '20' }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <IconSymbol name="xmark" size={24} color={text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: text }]} numberOfLines={1}>
            {fileName || 'PDF Document'}
          </Text>
          <View style={styles.downloadButton} />
        </View>

        {/* PDF Viewer */}
        <View style={styles.viewerContainer}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={tint} />
              <Text style={[styles.loadingText, { color: text }]}>Loading PDF...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <IconSymbol name="exclamationmark.triangle" size={48} color="#ef4444" />
              <Text style={[styles.errorText, { color: text }]}>Failed to load PDF</Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: tint }]}
                onPress={() => {
                  setError(false);
                  setLoading(true);
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          <WebView
            source={{ uri: viewerUrl }}
            style={styles.webview}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
            startInLoadingState={true}
            scalesPageToFit={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
  },
  downloadButton: {
    padding: 8,
  },
  viewerContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    zIndex: 10,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
