import { Colors } from '@/constants/theme';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import React, { useEffect } from 'react';
import { movementService } from '@/services/movement.service';
import GeminiPopup from '@/components/GeminiPopup';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import OfflineSavedRoutesModal from '@/components/OfflineSavedRoutesModal';
import { networkService } from '@/services/network.service';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';

function RootNavigator() {
  const { actualTheme } = useTheme();
  const colorScheme = actualTheme ?? 'light';
  const backgroundColor = Colors[colorScheme].background;

  return (
    <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(user)" />
        <Stack.Screen name="(government)" />
        <Stack.Screen name="(business)" />
        <Stack.Screen name="(monastery)" />

        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal', headerShown: true }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} backgroundColor={backgroundColor} translucent={false} />
      <Toast />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const [isOffline, setIsOffline] = React.useState(false);
  const [showOfflineModal, setShowOfflineModal] = React.useState(false);
  const [offlineModalIgnored, setOfflineModalIgnored] = React.useState(false);
  // Mount movement tracker once for the whole app
  function MovementTrackerMount() {
    useEffect(() => {
      // Start movement tracker when app mounts
      movementService.start();

      return () => {
        // Stop when unmounting
        movementService.stop();
      };
    }, []);

    return null;
  }

  // Check basic connectivity by attempting a small fetch to example.com
  React.useEffect(() => {
    const checkConnectivity = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        await fetch('https://www.google.com/favicon.ico', { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeout);
        setIsOffline(false);
      } catch (e) {
        setIsOffline(true);
      }
    };

    // Only check once on mount
    checkConnectivity();
  }, []);

  // Subscribe to networkService to detect network error events while app is running
  React.useEffect(() => {
    const unsub = networkService.subscribe((offline) => {
      setIsOffline(offline);
      if (offline && !isLoading && isAuthenticated && !offlineModalIgnored) {
        router.push('/(user)/explore' as any);
        setShowOfflineModal(true);
      } else if (!offline) {
        setShowOfflineModal(false);
        setOfflineModalIgnored(false);
      }
    });

    return () => {
      unsub();
    };
  }, [isLoading, isAuthenticated, offlineModalIgnored]);

  // Listen for explicit open saved routes requests from other parts of the app
  React.useEffect(() => {
    const unsubOpen = networkService.subscribeOpenSavedRoutes(() => {
      if (!isLoading && isAuthenticated) {
        router.push('/(user)/explore' as any);
        setShowOfflineModal(true);
      }
    });
    return () => {
      unsubOpen();
    };
  }, [isLoading, isAuthenticated]);

  React.useEffect(() => {
    if (!isLoading && isAuthenticated && isOffline && !offlineModalIgnored) {
      // route to explore and show saved routes modal
      router.push('/(user)/explore' as any);
      setShowOfflineModal(true);
    }
  }, [isLoading, isAuthenticated, isOffline]);

  return (
    <LanguageProvider>
      <ThemeProvider>
        <MovementTrackerMount />
        <RootNavigator />
        <OfflineSavedRoutesModal visible={showOfflineModal} onClose={() => { setShowOfflineModal(false); setOfflineModalIgnored(true); }} />
        <GeminiPopup />
      </ThemeProvider>
    </LanguageProvider>
  );
}
