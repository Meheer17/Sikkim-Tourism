import { DefaultTheme, DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const backgroundColor = Colors[colorScheme].background;
  
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(user)" />
        {/* <Stack.Screen name="(admin)" />
        <Stack.Screen name="(business)" />
        <Stack.Screen name="(organizer)" /> */}
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal', headerShown: true }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Toast />
    </ThemeProvider>
  );
}
