import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { getMessagesForConversation, listUsers, sendMessage } from '../firebase/service';

const TRAINER_SESSION_KEY = 'fitadvisor:trainerSession';

type TrainerSession = {
  trainerId: string;
  name: string;
  username: string;
};

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  senderType: 'user' | 'trainer';
  text: string;
  createdAt: number;
};

export default function TrainerMessages() {
  const [session, setSession] = useState<TrainerSession | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const loadSessionAndStudents = async () => {
    try {
      const storedSession = await AsyncStorage.getItem(TRAINER_SESSION_KEY);
      let parsed: TrainerSession | null = null;
      if (storedSession) {
        parsed = JSON.parse(storedSession);
        setSession(parsed);
      }
      if (!parsed?.trainerId) return;

      const users = await listUsers(parsed.trainerId);
      setStudents(users);
      if (!selectedStudentId && users.length > 0) {
        setSelectedStudentId(users[0].id);
      }
    } catch {
      // ignore
    }
  };

  const loadMessages = async (trainerId: string, studentId: string) => {
    try {
      const data = await getMessagesForConversation(studentId, trainerId);
      setMessages(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadSessionAndStudents();
  }, []);

  useEffect(() => {
    if (session?.trainerId && selectedStudentId) {
      loadMessages(session.trainerId, selectedStudentId);
    }
  }, [session?.trainerId, selectedStudentId]);

  const handleSend = async () => {
    if (!input.trim() || !session?.trainerId || !selectedStudentId) return;
    try {
      const res = await sendMessage({
        senderId: session.trainerId,
        receiverId: selectedStudentId,
        senderType: 'trainer',
        text: input.trim(),
      });
      if (res?.ok && res?.message) {
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
          <Text style={styles.title}>Trainer Mesajların</Text>
          <Text style={styles.subtitle}>Oturum bulunamadı. Lütfen trainer hesabınla giriş yap.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (students.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Trainer Mesajların</Text>
          <Text style={styles.subtitle}>Henüz atanmış öğrencin yok.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Trainer Mesajların</Text>
        <Text style={styles.subtitle}>Öğrencilerinle mesajlaş.</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.studentTabs}>
          {students.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.studentTab, selectedStudentId === s.id && styles.studentTabActive]}
              onPress={() => setSelectedStudentId(s.id)}
            >
              <Text style={styles.studentTabText}>{s.name || s.username}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.thread}>
          {messages.length === 0 ? (
            <Text style={styles.meta}>Henüz mesaj yok.</Text>
          ) : (
            messages.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.bubble,
                  m.senderId === session.trainerId ? styles.bubbleMe : styles.bubbleOther,
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
  studentTabs: { marginVertical: 10 },
  studentTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    marginRight: 8,
  },
  studentTabActive: { borderColor: '#10b981', backgroundColor: '#0f172a' },
  studentTabText: { color: '#e2e8f0', fontWeight: '700' },
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
