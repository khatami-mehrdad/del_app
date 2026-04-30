import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '@/lib/theme';
import type { CheckIn } from '@del/shared';
import { VoiceNotePlayer } from '@/components/VoiceNotePlayer';

interface Props {
  checkins: CheckIn[];
}

export function WeekCheckinHistory({ checkins }: Props) {
  const withContent = checkins.filter((c) => c.content_text || c.voice_note_url);
  if (withContent.length === 0) return null;

  return (
    <View style={styles.historyCard}>
      <Text style={styles.historyTitle}>Your check-ins this week</Text>
      {withContent.map((c) => {
        const d = new Date(c.created_at);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
        const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        return (
          <View key={c.id} style={styles.historyItem}>
            <Text style={styles.historyDay}>{dayName} · {time}</Text>
            {c.voice_note_url ? (
              <VoiceNotePlayer
                url={c.voice_note_url}
                duration={c.voice_note_duration_sec ?? 0}
                variant="onLight"
              />
            ) : (
              <Text style={styles.historyText}>"{c.content_text}"</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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
