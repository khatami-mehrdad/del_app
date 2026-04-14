import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '@/lib/theme';
import { DAYS } from './helpers';

interface Props {
  streakDone: boolean[];
  todayIndex: number;
}

export function StreakRow({ streakDone, todayIndex }: Props) {
  return (
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
  );
}

const styles = StyleSheet.create({
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
});
