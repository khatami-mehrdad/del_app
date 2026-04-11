import type { EmailOtpType } from '@supabase/supabase-js';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

type Phase = 'verifying' | 'password' | 'error';

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getInviteType(rawValue: string | undefined): EmailOtpType | null {
  return rawValue === 'invite' ? rawValue : null;
}

export default function ClientInviteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    token_hash?: string | string[];
    type?: string | string[];
  }>();
  const tokenHash = getParam(params.token_hash);
  const inviteType = useMemo(() => getInviteType(getParam(params.type)), [params.type]);
  const [phase, setPhase] = useState<Phase>('verifying');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bootstrapStarted = useRef(false);

  useEffect(() => {
    if (bootstrapStarted.current) return;
    bootstrapStarted.current = true;

    async function bootstrap() {
      if (!tokenHash || !inviteType) {
        setPhase('error');
        setError('This invite link is invalid or incomplete. Ask your coach for a new invite.');
        return;
      }

      const {
        data: { session: existingSession },
      } = await supabase.auth.getSession();

      if (existingSession?.user.user_metadata?.role === 'coach') {
        await supabase.auth.signOut();
      }

      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: inviteType,
      });

      if (verifyError) {
        setPhase('error');
        setError(verifyError.message);
        return;
      }

      setPhase('password');
    }

    void bootstrap();
  }, [inviteType, tokenHash]);

  async function handleSetPassword() {
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { password_set: true },
    });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inner}>
          <Text style={styles.logo}>del</Text>

          {phase === 'verifying' ? (
            <>
              <ActivityIndicator color={colors.gold} />
              <Text style={styles.helper}>Preparing your companion app invite</Text>
            </>
          ) : phase === 'password' ? (
            <>
              <Text style={styles.title}>Set your password</Text>
              <Text style={styles.body}>
                Your invite has been accepted. Choose a password, then you&apos;ll enter
                the client companion app.
              </Text>

              <TextInput
                style={styles.input}
                placeholder="New password"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
              />

              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
              />

              {error && <Text style={styles.error}>{error}</Text>}

              <TouchableOpacity
                style={[styles.button, submitting && styles.buttonDisabled]}
                onPress={() => void handleSetPassword()}
                disabled={submitting}
              >
                <Text style={styles.buttonText}>{submitting ? '...' : 'Continue'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>Invite unavailable</Text>
              <Text style={styles.body}>
                {error ??
                  'This invite link is no longer valid. Ask your coach to send you a new one.'}
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => router.replace('/login')}
              >
                <Text style={styles.buttonText}>Back to sign in</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  keyboard: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    fontFamily: fonts.serif.lightItalic,
    fontSize: 36,
    color: colors.goldLight,
    textAlign: 'center',
    marginBottom: 28,
  },
  title: {
    fontFamily: fonts.serif.regular,
    fontSize: 24,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    fontFamily: fonts.sans.light,
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.68)',
    textAlign: 'center',
    marginBottom: 24,
  },
  helper: {
    marginTop: 18,
    fontFamily: fonts.sans.extraLight,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.24)',
    textAlign: 'center',
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
  button: {
    backgroundColor: colors.gold,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: fonts.sans.light,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.white,
  },
});
