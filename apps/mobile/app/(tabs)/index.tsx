import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '@/lib/theme';
import { useAuth } from '@/lib/auth-context';
import { usePractice, useWeekCheckins, submitCheckin, markPracticeDone } from '@/lib/hooks';
import { useVoiceNote } from '@/lib/use-voice-note';
import { getGreeting, getDayName, getTodayIndex, buildStreakDone } from './home/helpers';
import { HomeEmptyState } from './home/HomeEmptyState';
import { StreakRow } from './home/StreakRow';
import { PracticeCard } from './home/PracticeCard';
import { DailyCheckinCard } from './home/DailyCheckinCard';
import { WeekCheckinHistory } from './home/WeekCheckinHistory';

export default function HomeScreen() {
  const { profile, program, user, signOut } = useAuth();
  const [checkinText, setCheckinText] = useState('');
  const [sending, setSending] = useState(false);
  const [marking, setMarking] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const voice = useVoiceNote();

  const weeksSinceStart = program
    ? Math.max(1, Math.ceil((Date.now() - new Date(program.start_date).getTime()) / (7 * 24 * 60 * 60 * 1000)))
    : 1;
  const currentWeek = Math.min(weeksSinceStart, program?.total_sessions ?? 12);

  const { practice } = usePractice(program?.id, currentWeek);
  const { checkins, refetch: refetchCheckins } = useWeekCheckins(program?.id);

  const todayIndex = getTodayIndex();
  const streakDone = buildStreakDone(checkins, todayIndex);
  const todayDone = streakDone[todayIndex];

  async function handleMarkDone() {
    if (!program || !user || marking || todayDone) return;
    setMarking(true);
    await markPracticeDone(program.id, user.id);
    await refetchCheckins();
    setMarking(false);
  }

  async function handleSendCheckin() {
    if (!program || !user) return;
    if (!checkinText.trim() && !voice.uri) return;
    setSending(true);
    const result = await submitCheckin(
      program.id,
      user.id,
      checkinText.trim() || null,
      false,
      voice.uri ?? undefined,
      voice.uri ? voice.duration : undefined
    );
    setSending(false);
    if (result.error) {
      Alert.alert('Check-in failed', result.error);
      return;
    }
    setCheckinText('');
    voice.reset();
    setJustSent(true);
    setTimeout(() => setJustSent(false), 3000);
    await refetchCheckins();
  }

  if (!profile || !program) {
    const reason = !profile
      ? 'No profile was found for this account.'
      : 'There is no active program linked to your account yet.';
    return <HomeEmptyState reason={reason} onSignOut={() => void signOut()} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.name}>{profile.full_name}</Text>
        <Text style={styles.dayLabel}>
          {getDayName()} · Week {currentWeek} of {program.total_sessions}
        </Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <StreakRow streakDone={streakDone} todayIndex={todayIndex} />
        <PracticeCard
          practice={practice}
          todayDone={todayDone}
          marking={marking}
          onMarkDone={handleMarkDone}
        />
        <DailyCheckinCard
          checkinText={checkinText}
          onChangeText={setCheckinText}
          sending={sending}
          justSent={justSent}
          voice={voice}
          onSend={handleSendCheckin}
        />
        <WeekCheckinHistory checkins={checkins} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: {
    backgroundColor: colors.brown,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  greeting: {
    fontFamily: fonts.serif.lightItalic,
    fontSize: 15,
    color: colors.goldLight,
    opacity: 0.7,
    marginBottom: 2,
  },
  name: {
    fontFamily: fonts.serif.light,
    fontSize: 28,
    color: colors.white,
    lineHeight: 32,
  },
  dayLabel: {
    fontFamily: fonts.sans.extraLight,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.3)',
    marginTop: 8,
  },
  body: { flex: 1 },
  bodyContent: { padding: 16, gap: 14 },
});
