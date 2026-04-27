import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '@/lib/theme';

interface Props {
  reason: string;
  onSignOut: () => void;
}

export function HomeEmptyState({ reason, onSignOut }: Props) {
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
          onPress={onSignOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Text style={styles.emptySignOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
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
});
