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
        options={{ title: 'My Favorites' }}
      />
      <Stack.Screen
        name="help-support"
        options={{ title: 'Help & Support' }}
      />
      <Stack.Screen
        name="safety"
        options={{ title: 'Safety Center' }}
      />
      <Stack.Screen
        name="booking-history"
        options={{ title: 'Booking History' }}
      />
      <Stack.Screen
        name="saved-places"
        options={{ title: 'Saved Places' }}
      />
      <Stack.Screen
        name="terms"
        options={{ title: 'Terms & Conditions' }}
      />
      <Stack.Screen
        name="privacy"
        options={{ title: 'Privacy Policy' }}
      />
      <Stack.Screen
        name="notifications"
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen
        name="language"
        options={{ title: 'Language' }}
      />
      <Stack.Screen
        name="about"
        options={{ title: 'About' }}
      />
      <Stack.Screen
        name="reviews"
        options={{ title: 'My Reviews' }}
      />
      <Stack.Screen
        name="vouchers"
        options={{ title: 'Vouchers' }}
      />
      <Stack.Screen
        name="friends"
        options={{
          title: 'Friends & Location',
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
        name="immersive-experience"
        options={{
          title: '360° Experience',
          headerShown: false,
          presentation: 'fullScreenModal',
        }}
      />
    </Stack>
  );
}
