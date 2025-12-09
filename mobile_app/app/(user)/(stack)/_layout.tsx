import { Stack } from "expo-router";

export default function StackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
        headerTintColor: '#0a7ea4',
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerShadowVisible: true,
        presentation: 'modal',
      }}
    >
      <Stack.Screen
        name="favorites"
        options={{ title: 'My Favorites', headerShown: false }}
      />
      <Stack.Screen
        name="help-support"
        options={{ title: 'Help & Support', headerShown: false }}
      />
      <Stack.Screen
        name="safety"
        options={{ title: 'Safety Center', headerShown: false }}
      />
      <Stack.Screen
        name="booking-history"
        options={{ title: 'Booking History', headerShown: false }}
      />
      <Stack.Screen
        name="saved-places"
        options={{ title: 'Saved Places', headerShown: false }}
      />
      <Stack.Screen
        name="terms"
        options={{ title: 'Terms & Conditions', headerShown: false }}
      />
      <Stack.Screen
        name="privacy"
        options={{ title: 'Privacy Policy', headerShown: false }}
      />
      <Stack.Screen
        name="notifications"
        options={{ title: 'Notifications', headerShown: false }}
      />
      <Stack.Screen
        name="language"
        options={{ title: 'Language', headerShown: false }}
      />
      <Stack.Screen
        name="about"
        options={{ title: 'About', headerShown: false }}
      />
      <Stack.Screen
        name="reviews"
        options={{ title: 'My Reviews', headerShown: false }}
      />
      <Stack.Screen
        name="vouchers"
        options={{ title: 'Vouchers', headerShown: false }}
      />
      <Stack.Screen
        name="service-details"
        options={{ title: 'Service Details', headerShown: false }}
      />

      <Stack.Screen
        name="friends"
        options={{
          title: 'Friends & Location',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="friends-list"
        options={{
          title: 'Friends List',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ai-planner"
        options={{
          title: 'AI Travel Planner',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ai-planner-chat"
        options={{
          title: 'AI Chat Planner',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ai-planner-results"
        options={{
          title: 'Travel Plans',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="place-details"
        options={{ 
          title: 'Place Details',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="create-business"
        options={{
          title: 'Create Business',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="edit-business"
        options={{
          title: 'Edit Business',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="my-businesses"
        options={{
          title: 'My Businesses',
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="immersive-experience"
        options={{
          title: '360° Experience',
          headerShown: false,
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{
          title: 'Edit Profile',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="schedule"
        options={{
          title: 'View Upcoming Events',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="create-event"
        options={{
          title: 'Create Event',
          headerShown: false,
        }}
      />

    </Stack>
  );
}
