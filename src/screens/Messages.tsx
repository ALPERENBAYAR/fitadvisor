import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { sendMessage, subscribeToConversation } from '../firebase/service';

const SESSION_KEY = 'fitadvisor:session';
const TRAINERS_KEY = 'fitadvisor:trainers';

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  senderType: 'user' | 'trainer';
  text: string;
  createdAt: number;
};

export default function Messages() {
  const [session, setSession] = useState<any>(null);
  const [trainer, setTrainer] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const loadSessionAndTrainer = async () => {
    try {
      const storedSession = await AsyncStorage.getItem(SESSION_KEY);
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        setSession(parsed);
        if (parsed?.assignedTrainerId) {
          const storedTrainers = await AsyncStorage.getItem(TRAINERS_KEY);
          const list = storedTrainers ? JSON.parse(storedTrainers) : [];
          if (Array.isArray(list)) {
            const found = list.find((t: any) => t.id === parsed.assignedTrainerId);
            if (found) setTrainer(found);
          }
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadSessionAndTrainer();
  }, []);

  useEffect(() => {
    if (session?.userId && session?.assignedTrainerId) {
      const unsub = subscribeToConversation(
        session.userId,
        session.assignedTrainerId,
        (data) => setMessages(data)
      );
      return () => {
        unsub();
      };
    }
    return undefined;
  }, [session?.userId, session?.assignedTrainerId]);

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
        setMessages((prev) => [...prev, res.message as any]);
        setInput('');
      }
    } catch {
      // ignore
    }
  };

  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Mesajlar</Text>
          <Text style={styles.subtitle}>Oturum bulunamadı. Lütfen giriş yap.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session.assignedTrainerId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Mesajlar</Text>
          <Text style={styles.subtitle}>Önce bir trainer ata, sonra mesajlaşabilirsin.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Trainer Mesajların</Text>
        <Text style={styles.subtitle}>
          {trainer ? `Trainer: ${trainer.name} (${trainer.username})` : 'Trainer bilgisi bulunamadı'}
        </Text>

        <View style={styles.thread}>
          {messages.length === 0 ? (
            <Text style={styles.meta}>Henüz mesaj yok.</Text>
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
                <Text style={styles.time}>{new Date(m.createdAt).toLocaleTimeString()}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Mesaj yaz..."
            placeholderTextColor="#9ca3af"
            style={styles.input}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendText}>Gönder</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0b1220' },
  container: { flex: 1, padding: 24, gap: 12 },
  content: { padding: 20, gap: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#f8fafc' },
  subtitle: { fontSize: 15, color: '#cbd5e1', lineHeight: 22 },
  thread: { gap: 10, marginTop: 10 },
  meta: { color: '#94a3b8', fontSize: 13 },
  bubble: {
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
  },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: '#10b981' },
  bubbleOther: { alignSelf: 'flex-start', backgroundColor: '#1f2937' },
  bubbleText: { color: '#0b1120', fontWeight: '600' },
  time: { fontSize: 11, color: '#0b1120', marginTop: 4 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
    color: '#f8fafc',
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  sendText: { color: '#0b1120', fontWeight: '800' },
});
