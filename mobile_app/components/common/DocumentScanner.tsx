import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { scanDocument, ScanDocumentResult } from '@/utils/document-scanner';

interface DocumentScannerButtonProps {
  onDocumentsScanned: (filePaths: string[]) => void;
  maxDocuments?: number;
  buttonText?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}

export const DocumentScannerButton: React.FC<DocumentScannerButtonProps> = ({
  onDocumentsScanned,
  maxDocuments,
  buttonText = 'Scan Document',
  icon = 'scan',
  disabled = false,
}) => {
  const [scanning, setScanning] = useState(false);
  const tint = useThemeColor('tint');
  const text = useThemeColor('text');

  const handleScan = async () => {
    setScanning(true);
    const result: ScanDocumentResult = await scanDocument(maxDocuments);
    setScanning(false);

    if (result.success && result.images.length > 0) {
      onDocumentsScanned(result.images);
    } else if (result.error && result.error !== 'Scan cancelled') {
      Alert.alert('Scan Error', result.error);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.scanButton, { backgroundColor: tint }, disabled && styles.disabled]}
      onPress={handleScan}
      disabled={disabled || scanning}
    >
      {scanning ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <Ionicons name={icon} size={20} color="#fff" />
          <Text style={styles.scanButtonText}>{buttonText}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

interface ScannedDocumentPreviewProps {
  documents: string[];
  onRemove?: (index: number) => void;
  maxHeight?: number;
}

export const ScannedDocumentPreview: React.FC<ScannedDocumentPreviewProps> = ({
  documents,
  onRemove,
  maxHeight = 150,
}) => {
  const card = useThemeColor('card');
  const text = useThemeColor('text');
  const border = useThemeColor('border');

  if (documents.length === 0) return null;

  return (
    <View style={styles.previewContainer}>
      <Text style={[styles.previewTitle, { color: text }]}>
        Scanned Documents ({documents.length})
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
        {documents.map((uri, index) => (
          <View
            key={index}
            style={[styles.previewItem, { backgroundColor: card, borderColor: border }]}
          >
            <Image
              source={{ uri }}
              style={[styles.previewImage, { maxHeight }]}
              resizeMode="contain"
            />
            {onRemove && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => onRemove(index)}
              >
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              </TouchableOpacity>
            )}
            <Text style={[styles.documentNumber, { color: text }]}>Doc {index + 1}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  previewContainer: {
    marginTop: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  previewScroll: {
    flexDirection: 'row',
  },
  previewItem: {
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    alignItems: 'center',
    minWidth: 120,
  },
  previewImage: {
    width: 100,
    height: 140,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  documentNumber: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});
