import { Stack } from 'expo-router';

export default function OrganizationStackLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="add-place" />
            <Stack.Screen name="edit-place" />
            <Stack.Screen name="place-details" />
            <Stack.Screen name="add-event" />
            <Stack.Screen name="edit-event" />
            <Stack.Screen name="event-details" />
            <Stack.Screen name="manage-tickets" />
            <Stack.Screen name="edit-profile" />
            <Stack.Screen name="settings" />
        </Stack>
    );
}
