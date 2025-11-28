import { Stack } from 'expo-router';
export default function BusinessStack() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="add-service" />
            <Stack.Screen name="manage-services" />
            <Stack.Screen name="payouts" />
            <Stack.Screen name="settings" />
        </Stack>
    );
}
