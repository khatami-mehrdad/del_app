import { useState, useRef } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import type { VoiceNoteHook } from '@del/data';

export function useVoiceNote(): VoiceNoteHook & { uri: string | null } {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [uri, setUri] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function startRecording() {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Microphone access needed',
          'Please allow microphone access in your device settings to record voice notes.'
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();

      recordingRef.current = rec;
      setRecording(true);
      setDuration(0);
      setUri(null);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err: any) {
      Alert.alert('Recording failed', err?.message ?? 'Unknown error');
    }
  }

  async function stopRecording() {
    if (!recordingRef.current) return null;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setRecording(false);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const fileUri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (!fileUri) return null;
      setUri(fileUri);
      return fileUri;
    } catch (err: any) {
      Alert.alert('Stop recording failed', err?.message ?? 'Unknown error');
      recordingRef.current = null;
      return null;
    }
  }

  function reset() {
    setUri(null);
    setDuration(0);
  }

  return { recording, duration, uri, startRecording, stopRecording, reset };
}
