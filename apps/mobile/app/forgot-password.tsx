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

const WEB_ORIGIN =
  process.env.EXPO_PUBLIC_WEB_APP_HOST
    ? `https://${process.env.EXPO_PUBLIC_WEB_APP_HOST.replace(/^https?:\/\//, '').split('/')[0]}`
    : 'https://del.saharshams.com';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    setError(null);
    setLoading(true);

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${WEB_ORIGIN}/auth/callback#type=recovery`,
    });

    setLoading(false);

    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.inner}>
          <Text style={styles.logo}>Del</Text>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.body}>
            We sent a password reset link to {email}. Open the link in a browser
            to set your new password, then come back here to sign in.
          </Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.btnText}>Back to sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>Del</Text>
        <Text style={styles.subtitle}>Reset password</Text>
        <Text style={styles.body}>
          Enter your email and we&apos;ll send you a link to reset your
          password.
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

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleReset}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? '...' : 'Send reset link'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backLink}
          onPress={() => router.back()}
        >
          <Text style={styles.backLinkText}>Back to sign in</Text>
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
  title: {
    fontFamily: fonts.serif.regular,
    fontSize: 22,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    fontFamily: fonts.sans.light,
    fontSize: 13,
    lineHeight: 20,
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
  backLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  backLinkText: {
    fontFamily: fonts.sans.extraLight,
    fontSize: 12,
    color: colors.gold,
    textDecorationLine: 'underline',
  },
});
