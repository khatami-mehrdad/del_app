import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts } from '@/lib/theme';
import type { Practice } from '@del/shared';

interface Props {
  practice: Practice | null;
  loading: boolean;
  todayDone: boolean;
  marking: boolean;
  onMarkDone: () => void;
}

export function PracticeCard({ practice, loading, todayDone, marking, onMarkDone }: Props) {
  if (!practice) {
    return (
      <View style={styles.practiceCard}>
        <Text style={styles.practiceTag}>This week's practice</Text>
        <Text style={[styles.practiceDesc, { marginBottom: 0 }]}>
          {loading
            ? 'Loading your practice...'
            : 'No practice posted yet - check back after your session.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.practiceCard}>
      <View style={styles.practiceAccent} />
      <Text style={styles.practiceTag}>This week's practice</Text>
      <Text style={styles.practiceTitle}>{practice.title}</Text>
      <Text style={styles.practiceDesc}>{practice.description}</Text>
      <TouchableOpacity
        style={[styles.practiceBtn, (todayDone || marking) && styles.practiceBtnDone]}
        onPress={onMarkDone}
        disabled={todayDone || marking}
      >
        <Text style={styles.practiceBtnText}>
          {marking ? '...' : todayDone ? 'Done today ✓' : 'Mark as done'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
  practiceBtnDone: {
    opacity: 0.5,
  },
  practiceBtnText: {
    fontFamily: fonts.sans.light,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.white,
  },
});
