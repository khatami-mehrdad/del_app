import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '@/lib/theme';
import { useAuth } from '@/lib/auth-context';
import { useJourneyEntries } from '@/lib/hooks';

export default function JourneyScreen() {
  const { program } = useAuth();
  const { entries, loading } = useJourneyEntries(program?.id);

  const weeksSinceStart = program
    ? Math.max(1, Math.ceil((Date.now() - new Date(program.start_date).getTime()) / (7 * 24 * 60 * 60 * 1000)))
    : 1;
  const currentWeek = Math.min(weeksSinceStart, program?.total_sessions ?? 12);
  const totalSessions = program?.total_sessions ?? 12;
  const totalMonths = program?.total_months ?? 3;
  const currentMonth = Math.min(Math.ceil(currentWeek / 4), totalMonths);
  const completedSessions = entries.length;
  const progress = completedSessions / totalSessions;

  if (!program) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Your journey</Text>
          <Text style={styles.subtitle}>Written by Sahar after each session</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            An active program is required. Open the Home tab for details, or ask your
            coach to finish setup.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Your journey</Text>
          <Text style={styles.subtitle}>Written by Sahar after each session</Text>
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Your journey</Text>
        <Text style={styles.subtitle}>Written by Sahar after each session</Text>
      </View>

      <View style={styles.progressSection}>
        <Text style={styles.progressLabel}>
          Month {currentMonth} of {totalMonths} · Week {currentWeek}
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressWeeks}>
          {completedSessions} of {totalSessions} sessions complete
        </Text>
      </View>

      <ScrollView style={styles.entries} contentContainerStyle={styles.entriesContent}>
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Your journey entries will appear here after each session with Sahar.
            </Text>
          </View>
        ) : (
          entries.map((entry) => (
            <View key={entry.id} style={styles.entryCard}>
              <Text style={styles.entryWeek}>
                Week {entry.week_number}
                {entry.week_number === currentWeek ? ' · This week' : ''}
              </Text>
              <Text style={styles.entryTitle}>"{entry.title}"</Text>
              <Text style={styles.entryBody}>{entry.body}</Text>
              <Text style={styles.entryDate}>
                {new Date(entry.session_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: colors.brown,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontFamily: fonts.serif.light,
    fontSize: 24,
    color: colors.white,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: fonts.sans.extraLight,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.3)',
  },
  progressSection: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: colors.creamDark,
  },
  progressLabel: {
    fontFamily: fonts.sans.extraLight,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.brownMid,
    opacity: 0.7,
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.creamMid,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 2,
  },
  progressWeeks: {
    fontFamily: fonts.sans.extraLight,
    fontSize: 10,
    color: colors.brownLight,
  },
  entries: { flex: 1 },
  entriesContent: { padding: 16, gap: 12 },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.sans.extraLight,
    fontSize: 13,
    color: colors.brownLight,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  entryCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 2,
    borderLeftColor: colors.gold,
  },
  entryWeek: {
    fontFamily: fonts.sans.extraLight,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.gold,
    marginBottom: 6,
  },
  entryTitle: {
    fontFamily: fonts.serif.italic,
    fontSize: 17,
    color: colors.brown,
    marginBottom: 6,
  },
  entryBody: {
    fontFamily: fonts.sans.light,
    fontSize: 13,
    color: colors.brownMid,
    lineHeight: 20,
  },
  entryDate: {
    fontFamily: fonts.sans.extraLight,
    fontSize: 10,
    color: colors.brownLight,
    opacity: 0.5,
    marginTop: 8,
  },
});
