import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function AuthLayout() {
    const colorScheme = useColorScheme() ?? 'light';
    const backgroundColor = Colors[colorScheme].background;
    
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor },
            }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
        </Stack>
    );
}
