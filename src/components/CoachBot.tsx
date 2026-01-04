import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  assignTrainerToUser,
  listTrainers,
  sendMessage,
  subscribeToConversation,
} from '../firebase/service';

const COACH_ENABLED_KEY = 'fitadvisor:coachbotEnabled';
const SESSION_KEY = 'fitadvisor:session';
const TRAINERS_KEY = 'fitadvisor:trainers';
const PROFILE_STORAGE_KEY = 'fitadvisor:profile';

const avatarSource = require('../../assets/images/kizgin-antrenor.png');

type Session = {
  userId: string;
  name?: string;
  username?: string;
  assignedTrainerId?: string | null;
};

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  senderType: 'user' | 'trainer';
  text: string;
  createdAt: number;
};

export default function CoachBot() {
  const insets = useSafeAreaInsets();
  const [enabled, setEnabled] = useState(true);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'trainers' | 'messages'>('trainers');
  const [session, setSession] = useState<Session | null>(null);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [trainerMessage, setTrainerMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const bottomOffset = Math.max(insets.bottom, 12) + 72;
  const panelWidth = 320;
  const panelRight = 12;
  const avatarSize = 62;
  const panelBottomGap = Math.round(avatarSize / 2) + 14;

  useEffect(() => {
    let mounted = true;
    const loadEnabled = async () => {
      try {
        const stored = await AsyncStorage.getItem(COACH_ENABLED_KEY);
        if (!mounted || stored === null) return;
        setEnabled(stored !== 'false');
      } catch {
        // ignore
      }
    };
    loadEnabled();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadSession = async () => {
      try {
        const storedSession = await AsyncStorage.getItem(SESSION_KEY);
        if (!active || !storedSession) return;
        const parsed = JSON.parse(storedSession);
        setSession(parsed);
      } catch {
        // ignore
      }
    };
    loadSession();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!open || activeTab !== 'trainers') return;
    let active = true;
    const loadTrainers = async () => {
      try {
        const remote = await listTrainers();
        if (!active) return;
        setTrainers(remote);
        await AsyncStorage.setItem(TRAINERS_KEY, JSON.stringify(remote));
      } catch {
        // ignore
      }
    };
    loadTrainers();
    return () => {
      active = false;
    };
  }, [open, activeTab]);

  useEffect(() => {
    if (!open || activeTab !== 'messages') return;
    if (!session?.userId || !session?.assignedTrainerId) return;
    const unsub = subscribeToConversation(
      session.userId,
      session.assignedTrainerId,
      (data) => setMessages(data as Message[])
    );
    return () => {
      unsub();
    };
  }, [open, activeTab, session?.userId, session?.assignedTrainerId]);

  const assignTrainer = async (trainerId: string, trainerName: string) => {
    if (!session?.userId) {
      setTrainerMessage('Once kullanici olarak giris yapmalisin.');
      return;
    }
    try {
      const res = await assignTrainerToUser(session.userId, trainerId);
      if (!res?.ok) {
        setTrainerMessage('Trainer atanamadi.');
        return;
      }
      const updatedSession = { ...session, assignedTrainerId: trainerId };
      setSession(updatedSession);
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
      const storedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      if (storedProfile) {
        const prof = JSON.parse(storedProfile);
        await AsyncStorage.setItem(
          PROFILE_STORAGE_KEY,
          JSON.stringify({ ...prof, assignedTrainerId: trainerId, assignedTrainerName: trainerName })
        );
      }
      setTrainerMessage('Trainer atandi.');
      setActiveTab('messages');
    } catch {
      setTrainerMessage('Trainer atanirken hata oldu.');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !session?.userId || !session?.assignedTrainerId) return;
    try {
      const res = await sendMessage({
        senderId: session.userId,
        receiverId: session.assignedTrainerId,
        senderType: 'user',
        text: input.trim(),
      });
      if (res?.ok && res.message) {
        setInput('');
      }
    } catch {
      // ignore
    }
  };

  const trainerTitle = useMemo(
    () => (session?.assignedTrainerId ? 'Trainer degistir' : 'Trainer sec'),
    [session?.assignedTrainerId]
  );

  if (!enabled) return null;

  return (
    <View pointerEvents="box-none" style={styles.root}>
      {open ? (
        <View
          style={[
            styles.chatPanel,
            {
              bottom: bottomOffset + 26,
              width: panelWidth,
              right: panelRight,
              paddingBottom: panelBottomGap,
            },
          ]}
        >
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>Antrenor Paneli</Text>
            <Pressable onPress={() => setOpen(false)}>
              <Text style={styles.closeText}>Kapat</Text>
            </Pressable>
          </View>

          <View style={styles.tabRow}>
            <Pressable
              onPress={() => setActiveTab('trainers')}
              style={[styles.tabButton, activeTab === 'trainers' && styles.tabButtonActive]}
            >
              <Text style={[styles.tabText, activeTab === 'trainers' && styles.tabTextActive]}>
                Trainerlar
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('messages')}
              style={[styles.tabButton, activeTab === 'messages' && styles.tabButtonActive]}
            >
              <Text style={[styles.tabText, activeTab === 'messages' && styles.tabTextActive]}>
                Mesajlar
              </Text>
            </Pressable>
          </View>

          {activeTab === 'trainers' ? (
            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>{trainerTitle}</Text>
              {trainers.length === 0 ? (
                <Text style={styles.meta}>Trainer bulunamadi.</Text>
              ) : (
                trainers.map((trainer) => (
                  <View key={trainer.id} style={styles.trainerItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.trainerName}>{trainer.name || trainer.username}</Text>
                      <Text style={styles.meta}>{trainer.specialty || 'Uzmanlik yok'}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.assignButton}
                      onPress={() => assignTrainer(trainer.id, trainer.name || trainer.username)}
                    >
                      <Text style={styles.assignText}>Ata</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
              {trainerMessage ? <Text style={styles.notice}>{trainerMessage}</Text> : null}
            </ScrollView>
          ) : (
            <View style={styles.body}>
              {!session?.assignedTrainerId ? (
                <Text style={styles.meta}>Mesaj icin once trainer ata.</Text>
              ) : (
                <>
                  <ScrollView style={styles.thread} showsVerticalScrollIndicator={false}>
                    {messages.length === 0 ? (
                      <Text style={styles.meta}>Henuz mesaj yok.</Text>
                    ) : (
                      messages.map((m) => (
                        <View
                          key={m.id}
                          style={[
                            styles.bubble,
                            m.senderId === session.userId ? styles.bubbleMe : styles.bubbleOther,
                          ]}
                        >
                          <Text style={styles.bubbleText}>{m.text}</Text>
                        </View>
                      ))
                    )}
                  </ScrollView>
                  <View style={styles.inputRow}>
                    <TextInput
                      value={input}
                      onChangeText={setInput}
                      placeholder="Mesaj yaz..."
                      placeholderTextColor="#9ca3af"
                      style={styles.input}
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                      <Text style={styles.sendText}>Gonder</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}
        </View>
      ) : null}

      <Pressable
        onPress={() => setOpen((prev) => !prev)}
        style={[
          styles.avatarButton,
          {
            bottom: bottomOffset - 12,
            right: panelRight + panelWidth / 2 - avatarSize / 2,
          },
        ]}
      >
        <Image source={avatarSource} style={styles.avatarImage} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    right: 16,
    left: 16,
    top: 0,
    bottom: 0,
    zIndex: 20,
    pointerEvents: 'box-none',
  },
  avatarButton: {
    position: 'absolute',
    right: 12,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  chatPanel: {
    position: 'absolute',
    maxHeight: 520,
    backgroundColor: '#0b1220',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    padding: 12,
    gap: 10,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatTitle: {
    color: '#e2e8f0',
    fontWeight: '800',
    fontSize: 14,
  },
  closeText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
  },
  tabButtonActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#0f172a',
  },
  tabText: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 12,
  },
  tabTextActive: {
    color: '#e2e8f0',
  },
  body: {
    flex: 1,
  },
  sectionTitle: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  trainerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  trainerName: {
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 14,
  },
  assignButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  assignText: {
    color: '#0b1120',
    fontWeight: '800',
    fontSize: 12,
  },
  notice: {
    marginTop: 8,
    color: '#94a3b8',
    fontSize: 12,
  },
  meta: {
    color: '#94a3b8',
    fontSize: 12,
  },
  thread: {
    maxHeight: 250,
  },
  bubble: {
    padding: 10,
    borderRadius: 12,
    maxWidth: '80%',
    marginBottom: 8,
  },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: '#10b981' },
  bubbleOther: { alignSelf: 'flex-start', backgroundColor: '#1f2937' },
  bubbleText: { color: '#0b1120', fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#1f2937',
    color: '#f8fafc',
    fontSize: 13,
  },
  sendButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  sendText: {
    color: '#0b1120',
    fontWeight: '800',
    fontSize: 12,
  },
});
