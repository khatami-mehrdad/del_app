import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors, fonts } from '@/lib/theme';
import { useAuth } from '@/lib/auth-context';

export function CoachUsingClientAppScreen() {
  const { signOut } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.inner}>
        <Text style={styles.logo}>del</Text>
        <Text style={styles.title}>Coach account</Text>
        <Text style={styles.body}>
          This app is the client companion. Your coach dashboard lives on the web — sign
          in there with this email. To try the mobile app, use the client account your
          coach invited (for example a separate email or a Gmail plus alias).
        </Text>
        <TouchableOpacity
          style={styles.signOut}
          onPress={() => void signOut()}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.brown },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logo: {
    fontFamily: fonts.serif.lightItalic,
    fontSize: 34,
    color: colors.goldLight,
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: fonts.serif.regular,
    fontSize: 22,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 14,
  },
  body: {
    fontFamily: fonts.sans.light,
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    marginBottom: 28,
  },
  signOut: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
    backgroundColor: colors.gold,
  },
  signOutText: {
    fontFamily: fonts.sans.light,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.white,
  },
});
