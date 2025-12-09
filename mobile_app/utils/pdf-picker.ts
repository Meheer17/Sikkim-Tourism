import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

export interface PickedPdf {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

export class PdfPicker {
  /**
   * Pick a PDF file from device
   */
  static async pickPdf(): Promise<PickedPdf | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      
      return {
        uri: asset.uri,
        name: asset.name,
        size: asset.size,
        mimeType: asset.mimeType || 'application/pdf',
      };
    } catch (error) {
      console.error('PDF picker error:', error);
      throw error;
    }
  }

  /**
   * Pick multiple PDF files from device
   */
  static async pickMultiplePdfs(): Promise<PickedPdf[]> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return [];
      }

      return result.assets.map(asset => ({
        uri: asset.uri,
        name: asset.name,
        size: asset.size,
        mimeType: asset.mimeType || 'application/pdf',
      }));
    } catch (error) {
      console.error('PDF picker error:', error);
      throw error;
    }
  }
}
