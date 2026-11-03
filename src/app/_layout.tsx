import { LilitaOne_400Regular } from '@expo-google-fonts/lilita-one';
import { Manrope_500Medium, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const [loaded] = useFonts({ LilitaOne_400Regular, Manrope_500Medium, Manrope_700Bold, Manrope_800ExtraBold });
  if (!loaded) return null;
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#160f3e' } }} />
    </>
  );
}
