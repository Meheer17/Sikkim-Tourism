import { Platform, PermissionsAndroid, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// Conditional import - only load native module if available
let DocumentScanner: any = null;
try {
  DocumentScanner = require('react-native-document-scanner-plugin').default;
} catch (e) {
  console.warn('Document scanner native module not available. Using image picker fallback.');
}

export interface ScanDocumentResult {
  success: boolean;
  images: string[];
  error?: string;
}

/**
 * Scan documents using the device camera
 * Falls back to image picker if native scanner is not available (Expo Go)
 * @param maxDocuments Maximum number of documents to scan (Android only)
 * @param quality Image quality from 0-100 (default: 100)
 * @returns Scanned document file paths
 */
export const scanDocument = async (
  maxDocuments?: number,
  quality: number = 100
): Promise<ScanDocumentResult> => {
  try {
    // If native scanner is available, use it
    if (DocumentScanner) {
      // Request camera permissions on Android if needed
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return {
            success: false,
            images: [],
            error: 'Camera permission denied. Please enable camera access in settings.',
          };
        }
      }

      // Start document scanner
      const { scannedImages, status } = await DocumentScanner.scanDocument({
        maxNumDocuments: maxDocuments,
        croppedImageQuality: quality,
      } as any);

      if (status === 'cancel') {
        return {
          success: false,
          images: [],
          error: 'Scan cancelled',
        };
      }

      if (!scannedImages || scannedImages.length === 0) {
        return {
          success: false,
          images: [],
          error: 'No documents scanned',
        };
      }

      return {
        success: true,
        images: scannedImages,
      };
    } else {
      // Fallback to image picker for Expo Go
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        return {
          success: false,
          images: [],
          error: 'Camera permission denied. Please enable camera access in settings.',
        };
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: quality / 100,
        base64: false,
      });

      if (result.canceled) {
        return {
          success: false,
          images: [],
          error: 'Scan cancelled',
        };
      }

      if (!result.assets || result.assets.length === 0) {
        return {
          success: false,
          images: [],
          error: 'No documents scanned',
        };
      }

      return {
        success: true,
        images: result.assets.map(asset => asset.uri),
      };
    }
  } catch (error: any) {
    console.error('Document scan error:', error);
    return {
      success: false,
      images: [],
      error: error.message || 'Failed to scan document',
    };
  }
};

/**
 * Scan a single document (convenience function)
 */
export const scanSingleDocument = async (quality: number = 100): Promise<ScanDocumentResult> => {
  return scanDocument(1, quality);
};

/**
 * Scan business license/registration documents (typically 2 pages)
 */
export const scanBusinessDocuments = async (quality: number = 100): Promise<ScanDocumentResult> => {
  return scanDocument(5, quality);
};

/**
 * Scan verification documents (ID cards, licenses, etc.)
 */
export const scanVerificationDocuments = async (quality: number = 100): Promise<ScanDocumentResult> => {
  return scanDocument(3, quality);
};
