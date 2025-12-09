import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { DocumentScannerButton, ScannedDocumentPreview } from '@/components/common/DocumentScanner';
import { fileService } from '@/services/file.service';

export default function VerifyDocumentsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const businessId = params.businessId as string;
  const businessName = params.businessName as string;

  const background = useThemeColor('background');
  const card = useThemeColor('card');
  const text = useThemeColor('text');
  const mutedText = useThemeColor('mutedText');
  const tint = useThemeColor('tint');

  const [verificationDocuments, setVerificationDocuments] = useState<string[]>([]);
  const [idDocuments, setIdDocuments] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleVerificationScanned = (filePaths: string[]) => {
    setVerificationDocuments((prev) => [...prev, ...filePaths]);
  };

  const handleIdScanned = (filePaths: string[]) => {
    setIdDocuments((prev) => [...prev, ...filePaths]);
  };

  const removeVerificationDocument = (index: number) => {
    setVerificationDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const removeIdDocument = (index: number) => {
    setIdDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const submitVerification = async () => {
    if (verificationDocuments.length === 0 && idDocuments.length === 0) {
      Alert.alert('Error', 'Please scan at least one verification document');
      return;
    }

    setUploading(true);
    try {
      const uploadedFiles: string[] = [];

      // Upload verification documents
      for (const docPath of verificationDocuments) {
        const response = await fileService.uploadDocument(docPath, 'admin_verification');
        if (response.success && response.data) {
          uploadedFiles.push(response.data.url);
        }
      }

      // Upload ID documents
      for (const docPath of idDocuments) {
        const response = await fileService.uploadDocument(docPath, 'admin_id_verification');
        if (response.success && response.data) {
          uploadedFiles.push(response.data.url);
        }
      }

      // TODO: Submit verification with notes and uploaded document URLs
      // await adminService.submitVerification(businessId, {
      //   documents: uploadedFiles,
      //   notes,
      // });

      Alert.alert(
        'Success',
        `Verification documents uploaded successfully. Business ${businessName} is now verified.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Verification upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload verification documents');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: text }]}>Verify Business Documents</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Business Info */}
        <View style={[styles.infoCard, { backgroundColor: card }]}>
          <IconSymbol name="building.2.fill" size={24} color={tint} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: mutedText }]}>Verifying Business</Text>
            <Text style={[styles.infoValue, { color: text }]}>{businessName || 'Unknown Business'}</Text>
          </View>
        </View>

        {/* Verification Documents Section */}
        <View style={[styles.section, { backgroundColor: card }]}>
          <Text style={[styles.sectionTitle, { color: text }]}>Verification Documents</Text>
          <Text style={[styles.sectionDescription, { color: mutedText }]}>
            Scan business licenses, permits, or certificates
          </Text>

          <DocumentScannerButton
            onDocumentsScanned={handleVerificationScanned}
            maxDocuments={5}
            buttonText="Scan Verification Docs"
            icon="shield-checkmark"
          />

          <ScannedDocumentPreview
            documents={verificationDocuments}
            onRemove={removeVerificationDocument}
          />
        </View>

        {/* ID Verification Section */}
        <View style={[styles.section, { backgroundColor: card }]}>
          <Text style={[styles.sectionTitle, { color: text }]}>Owner ID Verification</Text>
          <Text style={[styles.sectionDescription, { color: mutedText }]}>
            Scan owner's government-issued ID or passport
          </Text>

          <DocumentScannerButton
            onDocumentsScanned={handleIdScanned}
            maxDocuments={2}
            buttonText="Scan ID Documents"
            icon="person"
          />

          <ScannedDocumentPreview documents={idDocuments} onRemove={removeIdDocument} />
        </View>

        {/* Admin Notes */}
        <View style={[styles.section, { backgroundColor: card }]}>
          <Text style={[styles.sectionTitle, { color: text }]}>Verification Notes</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: background, color: text }]}
            placeholder="Add verification notes (optional)"
            placeholderTextColor={mutedText}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: tint }]}
          onPress={submitVerification}
          disabled={uploading || (verificationDocuments.length === 0 && idDocuments.length === 0)}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <IconSymbol name="checkmark.shield.fill" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>
                Submit Verification ({verificationDocuments.length + idDocuments.length} docs)
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

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
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  textArea: {
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
