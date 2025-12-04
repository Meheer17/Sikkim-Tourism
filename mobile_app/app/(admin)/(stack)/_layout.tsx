import { Stack } from 'expo-router';

export default function AdminStackLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="business-details" />
            <Stack.Screen name="add-business" />
            <Stack.Screen name="add-place" />
            <Stack.Screen name="edit-place" />
            <Stack.Screen name="user-details" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="analytics" />
            <Stack.Screen name="reports" />
            <Stack.Screen name="edit-profile" />
            <Stack.Screen name="security" />
        </Stack>
    );
}
