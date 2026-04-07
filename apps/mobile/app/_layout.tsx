import {
  CormorantGaramond_300Light,
  CormorantGaramond_300Light_Italic,
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_500Medium,
} from '@expo-google-fonts/cormorant-garamond';
import {
  Jost_200ExtraLight,
  Jost_300Light,
  Jost_400Regular,
} from '@expo-google-fonts/jost';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { colors, fonts } from '@/lib/theme';
import { supabaseConfigError } from '@/lib/supabase';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore duplicate or platform-specific splash timing errors during startup.
});

function AuthGate() {
  const { user, loading, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const current = String(segments[0] ?? '');
    const inLogin = current === 'login';
    const inInvite = current === 'client-invite';
    const inCoachOnly = current === 'coach-only';

    if (!user && !inLogin && !inInvite) {
      router.replace('/login');
      return;
    }

    if (!user || !profile) return;

    if (profile.role === 'coach') {
      if (!inCoachOnly && !inInvite) {
        router.replace('/coach-only' as never);
      }
      return;
    }

    if (inLogin || inCoachOnly) {
      router.replace('/(tabs)');
    }
  }, [user, loading, profile, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="coach-only" />
      <Stack.Screen name="client-invite" />
      <Stack.Screen name="login" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    CormorantGaramond_300Light,
    CormorantGaramond_300Light_Italic,
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_500Medium,
    Jost_200ExtraLight,
    Jost_300Light,
    Jost_400Regular,
  });
  const fontsReady = loaded || !!error;

  useEffect(() => {
    if (error) {
      console.error('Font loading failed', error);
    }
  }, [error]);

  useEffect(() => {
    if (fontsReady) {
      void SplashScreen.hideAsync().catch(() => {
        // Ignore if the splash screen was already hidden.
      });
    }
  }, [fontsReady]);

  if (!fontsReady) return null;

  if (supabaseConfigError) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.pageBg,
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}
      >
        <StatusBar style="light" />
        <Text
          style={{
            fontFamily: fonts.serif.lightItalic,
            fontSize: 34,
            color: colors.goldLight,
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          del
        </Text>
        <Text
          style={{
            fontFamily: fonts.sans.light,
            fontSize: 14,
            lineHeight: 22,
            color: 'rgba(255,255,255,0.72)',
            textAlign: 'center',
          }}
        >
          This build is missing required Supabase environment variables. Rebuild the
          Android app after setting `EXPO_PUBLIC_SUPABASE_URL` and
          `EXPO_PUBLIC_SUPABASE_ANON_KEY` in the build environment.
        </Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AuthGate />
    </AuthProvider>
  );
}
