import { Colors } from '@/constants/theme';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { useEffect } from 'react';
import { movementService } from '@/services/movement.service';
import GeminiPopup from '@/components/GeminiPopup';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
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

  return (
    <LanguageProvider>
      <ThemeProvider>
        <MovementTrackerMount />
        <RootNavigator />
        <GeminiPopup />
      </ThemeProvider>
    </LanguageProvider>
  );
}
