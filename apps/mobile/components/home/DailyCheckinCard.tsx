import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts } from '@/lib/theme';

interface VoiceState {
  recording: boolean;
  duration: number;
  uri: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<unknown>;
  reset: () => void;
}

interface Props {
  checkinText: string;
  onChangeText: (text: string) => void;
  sending: boolean;
  justSent: boolean;
  coachName: string;
  voice: VoiceState;
  onSend: () => void;
}

export function DailyCheckinCard({
  checkinText,
  onChangeText,
  sending,
  justSent,
  coachName,
  voice,
  onSend,
}: Props) {
  return (
    <View style={styles.checkinCard}>
      <Text style={styles.checkinTitle}>Daily check-in</Text>
      <Text style={styles.checkinQ}>What is present in you today?</Text>

      {justSent && (
        <View style={styles.sentBanner}>
          <Text style={styles.sentBannerText}>Sent to {coachName}</Text>
        </View>
      )}

      <TextInput
        style={styles.checkinInput}
        placeholder="Write, or record a voice note..."
        placeholderTextColor={colors.brownLight}
        multiline
        value={checkinText}
        onChangeText={onChangeText}
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
          onPress={onSend}
          disabled={sending}
        >
          <Text style={styles.sendBtnText}>
            {sending ? '...' : `Send to ${coachName}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
