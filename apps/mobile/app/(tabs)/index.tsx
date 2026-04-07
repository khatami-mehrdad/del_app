import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '@/lib/theme';
import { useAuth } from '@/lib/auth-context';
import { usePractice, useWeekCheckins, submitCheckin, markPracticeDone } from '@/lib/hooks';
import { useVoiceNote } from '@/lib/use-voice-note';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
}

function getDayName() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

export default function HomeScreen() {
  const { profile, program, user, signOut } = useAuth();
  const [checkinText, setCheckinText] = useState('');
  const [sending, setSending] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const voice = useVoiceNote();

  const weeksSinceStart = program
    ? Math.max(1, Math.ceil((Date.now() - new Date(program.start_date).getTime()) / (7 * 24 * 60 * 60 * 1000)))
    : 1;
  const currentWeek = Math.min(weeksSinceStart, program?.total_sessions ?? 12);

  const { practice } = usePractice(program?.id, currentWeek);
  const { checkins, refetch: refetchCheckins } = useWeekCheckins(program?.id);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayIndex = (new Date().getDay() + 6) % 7; // 0=Mon

  const streakDone = DAYS.map((_, i) => {
    const monday = new Date();
    monday.setDate(monday.getDate() - todayIndex + i);
    const dateStr = monday.toISOString().split('T')[0];
    return checkins.some(
      (c) => c.checkin_date === dateStr && c.practice_completed
    );
  });

  async function handleMarkDone() {
    if (!program || !user) return;
    await markPracticeDone(program.id, user.id);
    refetchCheckins();
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
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Almost there</Text>
          <Text style={styles.emptyBody}>
            {reason} The companion app is for clients who have been set up by your
            coach. If you expected access, ask them to add you from the coach
            dashboard (or confirm you signed in with the client email they used).
          </Text>
          <TouchableOpacity
            style={styles.emptySignOut}
            onPress={() => void signOut()}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Text style={styles.emptySignOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
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
        {/* Streak */}
        <View style={styles.streakRow}>
          {DAYS.map((day, i) => (
            <View
              key={i}
              style={[
                styles.streakDay,
                streakDone[i] && styles.streakDone,
                i === todayIndex && !streakDone[i] && styles.streakToday,
              ]}
            >
              <Text
                style={[
                  styles.streakDayText,
                  streakDone[i] && styles.streakDoneText,
                  i === todayIndex && !streakDone[i] && styles.streakTodayText,
                ]}
              >
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Practice Card */}
        {practice ? (
          <View style={styles.practiceCard}>
            <View style={styles.practiceAccent} />
            <Text style={styles.practiceTag}>This week's practice</Text>
            <Text style={styles.practiceTitle}>{practice.title}</Text>
            <Text style={styles.practiceDesc}>{practice.description}</Text>
            <TouchableOpacity style={styles.practiceBtn} onPress={handleMarkDone}>
              <Text style={styles.practiceBtnText}>
                {streakDone[todayIndex] ? 'Done today' : 'Mark as done'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.practiceCard}>
            <Text style={styles.practiceTag}>This week's practice</Text>
            <Text style={[styles.practiceDesc, { marginBottom: 0 }]}>
              No practice posted yet — check back after your session.
            </Text>
          </View>
        )}

        {/* Check-in */}
        <View style={styles.checkinCard}>
          <Text style={styles.checkinTitle}>Daily check-in</Text>
          <Text style={styles.checkinQ}>What is present in you today?</Text>

          {justSent && (
            <View style={styles.sentBanner}>
              <Text style={styles.sentBannerText}>Sent to Sahar</Text>
            </View>
          )}

          <TextInput
            style={styles.checkinInput}
            placeholder="Write, or record a voice note..."
            placeholderTextColor={colors.brownLight}
            multiline
            value={checkinText}
            onChangeText={setCheckinText}
          />
          {voice.uri && (
            <View style={styles.voicePreview}>
              <Text style={styles.voicePreviewText}>
                Voice note · {Math.floor(voice.duration / 60)}:{String(voice.duration % 60).padStart(2, '0')}
              </Text>
              <TouchableOpacity onPress={voice.reset}>
                <Text style={styles.voiceRemove}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.checkinActions}>
            <TouchableOpacity
              style={[styles.voiceBtn, voice.recording && styles.voiceBtnRecording]}
              onPress={voice.recording ? voice.stopRecording : voice.startRecording}
            >
              <Text style={[styles.voiceBtnText, voice.recording && styles.voiceBtnTextRecording]}>
                {voice.recording
                  ? `Stop · ${Math.floor(voice.duration / 60)}:${String(voice.duration % 60).padStart(2, '0')}`
                  : voice.uri
                    ? 'Re-record'
                    : 'Voice note'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sendBtn, sending && { opacity: 0.5 }]}
              onPress={handleSendCheckin}
              disabled={sending}
            >
              <Text style={styles.sendBtnText}>
                {sending ? '...' : 'Send to Sahar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* This week's check-in history */}
        {checkins.filter((c) => c.content_text || c.voice_note_url).length > 0 && (
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>Your check-ins this week</Text>
            {checkins
              .filter((c) => c.content_text || c.voice_note_url)
              .map((c) => {
                const d = new Date(c.created_at);
                const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
                const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                return (
                  <View key={c.id} style={styles.historyItem}>
                    <Text style={styles.historyDay}>{dayName} · {time}</Text>
                    <Text style={styles.historyText}>
                      {c.content_text
                        ? `"${c.content_text}"`
                        : `Voice note · ${Math.floor((c.voice_note_duration_sec ?? 0) / 60)}:${String((c.voice_note_duration_sec ?? 0) % 60).padStart(2, '0')}`}
                    </Text>
                  </View>
                );
              })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  emptyTitle: {
    fontFamily: fonts.serif.regular,
    fontSize: 22,
    color: colors.brown,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: fonts.sans.light,
    fontSize: 14,
    lineHeight: 22,
    color: colors.brownMid,
    textAlign: 'center',
    marginBottom: 28,
  },
  emptySignOut: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
    backgroundColor: colors.brown,
  },
  emptySignOutText: {
    fontFamily: fonts.sans.light,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.white,
  },
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
  streakRow: { flexDirection: 'row', gap: 6 },
  streakDay: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.creamMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakDone: { backgroundColor: colors.gold },
  streakToday: { backgroundColor: colors.brown },
  streakDayText: {
    fontFamily: fonts.sans.extraLight,
    fontSize: 11,
    color: colors.brownLight,
  },
  streakDoneText: { color: colors.white },
  streakTodayText: { color: colors.goldLight },
  practiceCard: {
    backgroundColor: colors.brown,
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
  },
  practiceAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.gold,
  },
  practiceTag: {
    fontFamily: fonts.sans.extraLight,
    fontSize: 10,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.gold,
    opacity: 0.8,
    marginBottom: 8,
  },
  practiceTitle: {
    fontFamily: fonts.serif.regular,
    fontSize: 20,
    color: colors.white,
    lineHeight: 26,
    marginBottom: 8,
  },
  practiceDesc: {
    fontFamily: fonts.sans.extraLight,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 20,
    marginBottom: 16,
  },
  practiceBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gold,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  practiceBtnText: {
    fontFamily: fonts.sans.light,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.white,
  },
  checkinCard: {
    backgroundColor: colors.creamDark,
    borderRadius: 16,
    padding: 20,
  },
  checkinTitle: {
    fontFamily: fonts.serif.regular,
    fontSize: 18,
    color: colors.brown,
    marginBottom: 4,
  },
  checkinQ: {
    fontFamily: fonts.sans.light,
    fontSize: 13,
    color: colors.brownMid,
    lineHeight: 20,
    marginBottom: 12,
  },
  checkinInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.creamMid,
    borderRadius: 10,
    padding: 12,
    fontFamily: fonts.sans.light,
    fontSize: 13,
    color: colors.brown,
    minHeight: 56,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  checkinActions: { flexDirection: 'row', gap: 8 },
  voiceBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.brownMid,
  },
  voiceBtnText: {
    fontFamily: fonts.sans.extraLight,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.brownMid,
  },
  sendBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: colors.brown,
    alignItems: 'center',
  },
  sendBtnText: {
    fontFamily: fonts.sans.light,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.white,
  },
  voicePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.brown,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  voicePreviewText: {
    fontFamily: fonts.sans.light,
    fontSize: 12,
    color: colors.goldLight,
  },
  voiceRemove: {
    fontFamily: fonts.sans.extraLight,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.4)',
  },
  voiceBtnRecording: {
    borderColor: '#C0392B',
    backgroundColor: 'rgba(192,57,43,0.08)',
  },
  voiceBtnTextRecording: {
    color: '#C0392B',
  },
  sentBanner: {
    backgroundColor: colors.gold,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  sentBannerText: {
    fontFamily: fonts.sans.light,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.white,
  },
  historyCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.creamMid,
  },
  historyTitle: {
    fontFamily: fonts.sans.extraLight,
    fontSize: 10,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.gold,
    marginBottom: 12,
  },
  historyItem: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.creamMid,
  },
  historyDay: {
    fontFamily: fonts.sans.extraLight,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.brownLight,
    marginBottom: 4,
  },
  historyText: {
    fontFamily: fonts.serif.italic,
    fontSize: 14,
    color: colors.brownMid,
    lineHeight: 20,
  },
});
