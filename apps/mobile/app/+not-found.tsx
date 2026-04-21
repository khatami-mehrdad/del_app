import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/lib/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn&apos;t exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.cream,
  },
  title: {
    fontFamily: fonts.serif.regular,
    fontSize: 20,
    color: colors.brown,
  },
  link: {
    marginTop: 16,
    paddingVertical: 12,
  },
  linkText: {
    fontFamily: fonts.sans.light,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.gold,
  },
});
