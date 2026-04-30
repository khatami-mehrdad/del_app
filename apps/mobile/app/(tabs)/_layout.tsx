import { Tabs } from 'expo-router';
import { ActivityIndicator, Platform, View } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, fonts } from '@/lib/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth-context';
import { useUnreadMessageCount } from '@/lib/hooks';
import { CoachUsingClientAppScreen } from '@/components/CoachUsingClientAppScreen';

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 16 16" fill="none">
      <Path
        d="M2 6L8 2L14 6V14H10V10H6V14H2V6Z"
        stroke={color}
        strokeWidth={1}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MessagesIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 16 16" fill="none">
      <Circle cx={8} cy={8} r={6} stroke={color} strokeWidth={1} />
      <Path d="M6 8L8 10L11 6" stroke={color} strokeWidth={1} />
    </Svg>
  );
}

function JourneyIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 16 16" fill="none">
      <Path
        d="M3 12V8C3 5.2 5.2 3 8 3C10.8 3 13 5.2 13 8V12"
        stroke={color}
        strokeWidth={1}
      />
      <Rect x={1} y={11} width={3} height={3} rx={1} stroke={color} strokeWidth={1} />
      <Rect x={12} y={11} width={3} height={3} rx={1} stroke={color} strokeWidth={1} />
    </Svg>
  );
}

export default function TabLayout() {
  const { user, profile, program, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 16);
  const unreadMessages = useUnreadMessageCount(program?.id, user?.id);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.cream,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (profile?.role === 'coach') {
    return <CoachUsingClientAppScreen />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(42,26,14,0.95)',
          borderTopColor: 'rgba(184,146,74,0.1)',
          borderTopWidth: 1,
          height: 60 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.25)',
        tabBarLabelStyle: {
          fontFamily: fonts.sans.extraLight,
          fontSize: 9,
          letterSpacing: 1,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <MessagesIcon color={color} />,
          tabBarBadge: unreadMessages > 0 ? unreadMessages : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.gold,
            color: colors.brown,
            fontFamily: fonts.sans.regular,
            fontSize: 10,
          },
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: 'Journey',
          tabBarIcon: ({ color }) => <JourneyIcon color={color} />,
        }}
      />
    </Tabs>
  );
}
