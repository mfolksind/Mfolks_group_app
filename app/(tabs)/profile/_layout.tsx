import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="personal-info" />
      <Stack.Screen name="company-info" />
      <Stack.Screen name="addresses" />
      <Stack.Screen name="order-history" />

      <Stack.Screen name="support" />
    </Stack>
  );
}
