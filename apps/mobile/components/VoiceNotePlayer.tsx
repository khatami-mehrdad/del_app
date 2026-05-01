import { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { colors, fonts } from '@/lib/theme';

interface Props {
  url: string;
  duration: number;
  variant?: 'onDark' | 'onLight';
}

const WAVE_HEIGHTS = [8, 14, 10, 16, 8, 12, 6, 14, 10, 8];

export function VoiceNotePlayer({ url, duration, variant = 'onLight' }: Props) {
  const [playing, setPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const mins = Math.floor(duration / 60);
  const secs = duration % 60;

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        void soundRef.current.unloadAsync().catch(() => undefined);
        soundRef.current = null;
      }
    };
  }, []);

  async function togglePlay() {
    if (playing && soundRef.current) {
      try {
        await soundRef.current.stopAsync();
      } catch {
        // ignore
      }
      try {
        await soundRef.current.unloadAsync();
      } catch {
        // ignore
      }
      soundRef.current = null;
      setPlaying(false);
      return;
    }
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) {
          if ('error' in status && status.error) {
            console.warn('Voice note playback error:', status.error);
          }
          return;
        }
        if (status.didJustFinish) {
          setPlaying(false);
          void sound.unloadAsync();
          soundRef.current = null;
        }
      });
      setPlaying(true);
    } catch (err: any) {
      console.warn('Voice note playback failed:', err?.message ?? err, 'url:', url);
      Alert.alert('Cannot play voice note', err?.message ?? 'Unknown error');
      setPlaying(false);
    }
  }

  const isDark = variant === 'onDark';
  const playBg = isDark ? colors.gold : colors.brown;
  const waveColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(124,82,57,0.3)';
  const durColor = isDark ? 'rgba(255,255,255,0.4)' : colors.brownLight;

  return (
    <TouchableOpacity style={styles.row} onPress={togglePlay}>
      <View
        style={[
          styles.playBtn,
          { backgroundColor: playing ? '#C0392B' : playBg },
        ]}
      >
        <Text style={styles.playIcon}>{playing ? '■' : '▶'}</Text>
      </View>
      <View style={styles.waveform}>
        {WAVE_HEIGHTS.map((h, i) => (
          <View key={i} style={[styles.waveBar, { height: h, backgroundColor: waveColor }]} />
        ))}
      </View>
      <Text style={[styles.dur, { color: durColor }]}>
        {mins}:{secs.toString().padStart(2, '0')}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 180 },
  playBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { color: colors.white, fontSize: 10 },
  waveform: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 },
  waveBar: { width: 2.5, borderRadius: 1 },
  dur: {
    fontFamily: fonts.sans.extraLight,
    fontSize: 10,
  },
});
