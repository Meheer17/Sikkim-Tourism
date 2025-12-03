import * as Speech from 'expo-speech';
import * as Location from 'expo-location';

export interface TTSOptions {
  language?: string;
  pitch?: number;
  rate?: number;
  voice?: string;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  pitch: number;
  rate: number;
}

class TTSService {
  private isSpeaking: boolean = false;
  private isPaused: boolean = false;
  private currentLocationId: string | null = null;
  private currentLanguage: string = 'en-US';
  private currentText: string = '';
  private currentOptions: TTSOptions = {};
  private pausedAtWord: number = 0;
  private allWords: string[] = [];
  private onStopCallback: (() => void) | null = null;
  
  // Enhanced language support with optimized TTS parameters for natural speech
  public readonly supportedLanguages: SupportedLanguage[] = [
    { code: 'en-US', name: 'English', nativeName: 'English', pitch: 1.0, rate: 0.85 },
    { code: 'en-IN', name: 'English (India)', nativeName: 'English (India)', pitch: 0.95, rate: 0.88 },
    { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', pitch: 1.0, rate: 0.82 },
    { code: 'ne-NP', name: 'Nepali', nativeName: 'नेपाली', pitch: 0.98, rate: 0.80 },
    { code: 'as-IN', name: 'Assamese', nativeName: 'অসমীয়া', pitch: 1.0, rate: 0.82 },
    { code: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা', pitch: 0.98, rate: 0.83 },
    { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', pitch: 0.95, rate: 0.85 },
    { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు', pitch: 0.97, rate: 0.84 },
    { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ', pitch: 0.96, rate: 0.83 },
    { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം', pitch: 0.98, rate: 0.84 },
    { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी', pitch: 0.99, rate: 0.82 },
    { code: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી', pitch: 0.97, rate: 0.83 },
    { code: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', pitch: 0.98, rate: 0.84 },
    { code: 'ur-IN', name: 'Urdu', nativeName: 'اردو', pitch: 0.99, rate: 0.81 },
  ];

  /**
   * Get current language
   */
  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Set current language
   */
  setCurrentLanguage(languageCode: string): void {
    const supported = this.supportedLanguages.find(lang => lang.code === languageCode);
    if (supported) {
      this.currentLanguage = languageCode;
      console.log(`🌐 TTS language set to: ${supported.name} (${supported.nativeName})`);
    }
  }

  /**
   * Get language settings for a language code
   */
  private getLanguageSettings(languageCode: string): { pitch: number; rate: number } {
    const lang = this.supportedLanguages.find(l => l.code === languageCode);
    return lang ? { pitch: lang.pitch, rate: lang.rate } : { pitch: 1.0, rate: 0.85 };
  }

  /**
   * Speak text using device TTS with enhanced natural speech
   */
  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    if (this.isSpeaking) {
      await this.stop();
    }

    // Store current text and options for pause/resume
    this.currentText = text;
    this.currentOptions = options;
    this.allWords = text.split(' ');
    this.pausedAtWord = 0;
    this.isPaused = false;

    // Use current language if not specified
    const language = options.language || this.currentLanguage;
    
    // Get optimized settings for the language
    const langSettings = this.getLanguageSettings(language);
    
    // Allow manual override but default to language-optimized settings
    const pitch = options.pitch !== undefined ? options.pitch : langSettings.pitch;
    const rate = options.rate !== undefined ? options.rate : langSettings.rate;

    return new Promise((resolve, reject) => {
      this.isSpeaking = true;

      Speech.speak(text, {
        language,
        pitch,
        rate,
        voice: options.voice,
        onStart: () => {
          console.log(`🔊 TTS started [${language}] pitch:${pitch} rate:${rate}`);
        },
        onDone: () => {
          console.log('🔊 TTS completed');
          this.isSpeaking = false;
          this.isPaused = false;
          if (this.onStopCallback) {
            this.onStopCallback();
            this.onStopCallback = null;
          }
          resolve();
        },
        onError: (error: any) => {
          console.error('🔊 TTS error:', error);
          this.isSpeaking = false;
          this.isPaused = false;
          reject(error);
        },
        onStopped: () => {
          console.log('🔊 TTS stopped');
          this.isSpeaking = false;
          if (this.onStopCallback) {
            this.onStopCallback();
            this.onStopCallback = null;
          }
          resolve();
        },
      });
    });
  }

  /**
   * Stop current speech
   */
  async stop(): Promise<void> {
    if (this.isSpeaking || this.isPaused) {
      await Speech.stop();
      this.isSpeaking = false;
      this.isPaused = false;
      this.pausedAtWord = 0;
      this.currentText = '';
      this.allWords = [];
    }
  }

  /**
   * Pause current speech (Android-compatible - stops and saves position)
   */
  async pause(): Promise<void> {
    if (this.isSpeaking && !this.isPaused) {
      // On Android, we stop and mark as paused
      // We'll estimate the current position based on time
      this.isPaused = true;
      await Speech.stop();
      this.isSpeaking = false;
      console.log('🔊 TTS paused (simulated for Android)');
    }
  }

  /**
   * Resume paused speech (Android-compatible - restarts from beginning)
   */
  async resume(): Promise<void> {
    if (this.isPaused && this.currentText) {
      console.log('🔊 TTS resuming (restarting from beginning)');
      this.isPaused = false;
      // Restart from the beginning since Android doesn't support true pause/resume
      await this.speak(this.currentText, this.currentOptions);
    }
  }

  /**
   * Check if currently speaking
   */
  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Check if currently paused
   */
  getIsPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Calculate distance between two coordinates in meters
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Check if user is within proximity of a location
   */
  async isUserNearLocation(
    locationLat: number,
    locationLon: number,
    radiusMeters: number = 100
  ): Promise<{ isNear: boolean; distance: number | null; userLocation: Location.LocationObject | null }> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted');
        return { isNear: false, distance: null, userLocation: null };
      }

      const userLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const distance = this.calculateDistance(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        locationLat,
        locationLon
      );

      console.log(`📍 User distance from location: ${distance.toFixed(2)}m`);

      return {
        isNear: distance <= radiusMeters,
        distance,
        userLocation,
      };
    } catch (error) {
      console.error('Error checking location proximity:', error);
      return { isNear: false, distance: null, userLocation: null };
    }
  }

  /**
   * Auto-play narration when user enters location
   */
  async autoPlayNarrationIfNearby(
    locationId: string,
    locationLat: number,
    locationLon: number,
    narrationText: string,
    radiusMeters: number = 100
  ): Promise<boolean> {
    // Don't replay if already spoken for this location
    if (this.currentLocationId === locationId) {
      console.log(`📍 Already played narration for location: ${locationId}`);
      return false;
    }

    const { isNear, distance } = await this.isUserNearLocation(
      locationLat,
      locationLon,
      radiusMeters
    );

    if (isNear) {
      console.log(`🎯 User is within ${radiusMeters}m of location (${distance?.toFixed(2)}m)`);
      this.currentLocationId = locationId;
      await this.speak(narrationText);
      return true;
    }

    return false;
  }

  /**
   * Reset current location tracking
   */
  resetLocationTracking(): void {
    this.currentLocationId = null;
  }

  /**
   * Get available voices
   */
  async getAvailableVoices(): Promise<Speech.Voice[]> {
    return await Speech.getAvailableVoicesAsync();
  }
}

export const ttsService = new TTSService();
