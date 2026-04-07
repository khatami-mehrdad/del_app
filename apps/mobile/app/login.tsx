import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(null);
    setLoading(true);

    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (err) {
      setError(err.message);
    } else {
      router.replace('/(tabs)');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>del</Text>
        <Text style={styles.subtitle}>Companion App</Text>
        <Text style={styles.helper}>
          New here? Open your invite email on this phone to finish setting up your
          client account.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="rgba(255,255,255,0.25)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="rgba(255,255,255,0.25)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? '...' : 'Sign in'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pageBg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  inner: { width: '100%', maxWidth: 320 },
  logo: {
    fontFamily: fonts.serif.lightItalic,
    fontSize: 36,
    color: colors.goldLight,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fonts.sans.extraLight,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.2)',
    textAlign: 'center',
    marginBottom: 16,
  },
  helper: {
    fontFamily: fonts.sans.light,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.42)',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 14,
    fontFamily: fonts.sans.light,
    fontSize: 14,
    color: colors.white,
    marginBottom: 12,
  },
  error: {
    fontFamily: fonts.sans.light,
    fontSize: 12,
    color: '#e57373',
    textAlign: 'center',
    marginBottom: 12,
  },
  btn: {
    backgroundColor: colors.gold,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    fontFamily: fonts.sans.light,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.white,
  },
});
