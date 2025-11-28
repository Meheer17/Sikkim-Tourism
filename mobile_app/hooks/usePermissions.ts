import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Platform, Alert, Linking } from 'react-native';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

interface PermissionsState {
  location: PermissionStatus;
  activity: PermissionStatus;
}

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<PermissionsState>({
    location: 'undetermined',
    activity: 'undetermined',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      // Check location permission
      const { status: locationStatus } = await Location.getForegroundPermissionsAsync();
      
      setPermissions({
        location: locationStatus === 'granted' ? 'granted' : locationStatus === 'denied' ? 'denied' : 'undetermined',
        activity: 'granted', // Activity permission is primarily for Android fitness tracking
      });
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      const newStatus: PermissionStatus = status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
      
      setPermissions(prev => ({
        ...prev,
        location: newStatus,
      }));

      if (status === 'denied') {
        Alert.alert(
          'Location Permission Required',
          'This app needs access to your location to show nearby places and provide personalized recommendations. Please enable location access in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            },
          ]
        );
      }

      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    try {
      if (permissions.location !== 'granted') {
        const granted = await requestLocationPermission();
        if (!granted) return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  };

  const watchLocation = async (callback: (location: Location.LocationObject) => void) => {
    try {
      if (permissions.location !== 'granted') {
        const granted = await requestLocationPermission();
        if (!granted) return null;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        callback
      );

      return subscription;
    } catch (error) {
      console.error('Error watching location:', error);
      return null;
    }
  };

  return {
    permissions,
    isLoading,
    requestLocationPermission,
    getCurrentLocation,
    watchLocation,
    checkPermissions,
  };
};
