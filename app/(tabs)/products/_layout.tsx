import { Stack } from 'expo-router';

export default function ProductsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="family" />
      <Stack.Screen name="category" />
      <Stack.Screen name="list" />
      <Stack.Screen name="[productId]" />
      <Stack.Screen name="buy" />
    </Stack>
  );
}
