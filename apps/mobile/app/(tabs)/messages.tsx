import { useCallback, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { colors, fonts } from '@/lib/theme';
import { useAuth } from '@/lib/auth-context';
import { useMessages, sendMessage, markMessagesRead } from '@/lib/hooks';
import { useVoiceNote } from '@/lib/use-voice-note';
import { VoiceNotePlayer } from '@/components/VoiceNotePlayer';

function formatTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'pm' : 'am';
  return `${h % 12 || 12}:${m}${ampm}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

export default function MessagesScreen() {
  const { user, program } = useAuth();
  const { messages, loading } = useMessages(program?.id);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const voice = useVoiceNote();
  const coachName = program?.coach.full_name ?? 'your coach';
  const coachInitial = coachName.charAt(0).toUpperCase();

  // Only mark messages as read while the user is actively viewing this
  // screen. Without the focus gate, the tab stays mounted in the background
  // and every new INSERT would auto-mark-read instantly — defeating the
  // unread-count badge on the tab bar.
  useFocusEffect(
    useCallback(() => {
      if (program && user) {
        void markMessagesRead(program.id, user.id);
      }
    }, [messages.length, program, user])
  );

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  if (!program) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{coachInitial}</Text>
          </View>
          <View>
            <Text style={styles.headerName}>{coachName}</Text>
            <Text style={styles.headerStatus}>Responds within 24 hours</Text>
          </View>
        </View>
        <View style={styles.noProgramWrap}>
          <Text style={styles.noProgramText}>
            Messaging needs an active program. Open the Home tab for details, or ask
            your coach to finish setup.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  async function handleSend() {
    if ((!input.trim() && !voice.uri) || !program || !user) return;
    setSending(true);
    try {
      const result = await sendMessage(
        program.id,
        user.id,
        input.trim(),
        voice.uri ?? undefined,
        voice.uri ? voice.duration : undefined
      );
      if (result.error) {
        Alert.alert('Message failed', result.error);
        return;
      }
      setInput('');
      voice.reset();
    } catch {
      Alert.alert('Message failed', 'Please try again.');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{coachInitial}</Text>
          </View>
          <View>
            <Text style={styles.headerName}>{coachName}</Text>
            <Text style={styles.headerStatus}>Responds within 24 hours</Text>
          </View>
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  let lastDate = '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{coachInitial}</Text>
          </View>
          <View>
            <Text style={styles.headerName}>{coachName}</Text>
            <Text style={styles.headerStatus}>Responds within 24 hours</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => {
            const msgDate = formatDate(msg.created_at);
            const showDate = msgDate !== lastDate;
            lastDate = msgDate;
            const isMe = msg.sender_id === user?.id;

            return (
              <View key={msg.id}>
                {showDate && <Text style={styles.dateSep}>{msgDate}</Text>}
                <View
                  style={[
                    styles.bubble,
                    isMe ? styles.bubbleClient : styles.bubbleCoach,
                  ]}
                >
                  {msg.voice_note_url ? (
                    <VoiceNotePlayer
                      url={msg.voice_note_url}
                      duration={msg.voice_note_duration_sec ?? 0}
                      variant={isMe ? 'onLight' : 'onDark'}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.msgText,
                        isMe ? styles.msgTextClient : styles.msgTextCoach,
                      ]}
                    >
                      {msg.content_text}
                    </Text>
                  )}
                  <Text
                    style={[
                      styles.msgTime,
                      isMe ? styles.msgTimeClient : styles.msgTimeCoach,
                    ]}
                  >
                    {!isMe ? `From ${coachName} · ${formatTime(msg.created_at)}` : formatTime(msg.created_at)}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {voice.uri && (
          <View style={styles.voicePreview}>
            <Text style={styles.voicePreviewText}>
              Voice note · {Math.floor(voice.duration / 60)}:{String(voice.duration % 60).padStart(2, '0')}
            </Text>
            <TouchableOpacity onPress={voice.reset}>
              <Text style={styles.voiceRemoveText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={[styles.micBtn, voice.recording && styles.micBtnRecording]}
            onPress={voice.recording ? voice.stopRecording : voice.startRecording}
          >
            <Text style={[styles.micBtnText, voice.recording && styles.micBtnTextRecording]}>
              {voice.recording
                ? `${Math.floor(voice.duration / 60)}:${String(voice.duration % 60).padStart(2, '0')}`
                : '🎤'}
            </Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Write a message..."
            placeholderTextColor="rgba(154,117,96,0.5)"
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() && !voice.uri || sending) && { opacity: 0.4 }]}
            onPress={handleSend}
            disabled={(!input.trim() && !voice.uri) || sending}
          >
            <Text style={styles.sendBtnText}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noProgramWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 32,
  },
  noProgramText: {
    fontFamily: fonts.sans.light,
    fontSize: 14,
    lineHeight: 22,
    color: colors.brownMid,
    textAlign: 'center',
  },
  header: {
    backgroundColor: colors.brown,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.serif.lightItalic,
    fontSize: 16,
    color: colors.white,
  },
  headerName: {
    fontFamily: fonts.serif.light,
    fontSize: 20,
    color: colors.white,
  },
  headerStatus: {
    fontFamily: fonts.sans.extraLight,
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.5,
  },
  body: { flex: 1 },
  bodyContent: { padding: 16, gap: 10 },
  dateSep: {
    textAlign: 'center',
    fontFamily: fonts.sans.extraLight,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.brownLight,
    opacity: 0.5,
    marginVertical: 6,
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  bubbleCoach: {
    backgroundColor: colors.brown,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  bubbleClient: {
    backgroundColor: colors.creamDark,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  msgText: {
    fontFamily: fonts.sans.light,
    fontSize: 13,
    lineHeight: 20,
  },
  msgTextCoach: { color: 'rgba(255,255,255,0.75)' },
  msgTextClient: { color: colors.brown },
  msgTime: {
    fontFamily: fonts.sans.extraLight,
    fontSize: 9,
    marginTop: 4,
  },
  msgTimeCoach: { color: 'rgba(255,255,255,0.25)' },
  msgTimeClient: { color: colors.brownLight, opacity: 0.5, textAlign: 'right' },
  voicePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.brown,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 12,
    marginTop: 8,
  },
  voicePreviewText: {
    fontFamily: fonts.sans.light,
    fontSize: 12,
    color: colors.goldLight,
  },
  voiceRemoveText: {
    fontFamily: fonts.sans.extraLight,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.4)',
  },
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.creamDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnRecording: {
    backgroundColor: 'rgba(192,57,43,0.1)',
  },
  micBtnText: {
    fontSize: 16,
  },
  micBtnTextRecording: {
    fontFamily: fonts.sans.extraLight,
    fontSize: 10,
    color: '#C0392B',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.creamMid,
    backgroundColor: colors.cream,
  },
  input: {
    flex: 1,
    backgroundColor: colors.creamDark,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: fonts.sans.light,
    fontSize: 13,
    color: colors.brown,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brown,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '300',
  },
});
