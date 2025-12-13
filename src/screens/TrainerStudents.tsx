import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { listUsers } from '../firebase/service';

const TRAINER_SESSION_KEY = 'fitadvisor:trainerSession';

type TrainerSession = {
  trainerId: string;
  name: string;
  username: string;
};

export default function TrainerStudents() {
  const [session, setSession] = useState<TrainerSession | null>(null);
  const [students, setStudents] = useState<any[]>([]);

  const loadStudents = async () => {
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
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Öğrenciler</Text>
          <Text style={styles.subtitle}>Oturum bulunamadı. Lütfen trainer hesabınla giriş yap.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Öğrenciler</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={loadStudents}>
            <Text style={styles.refreshButtonText}>Yenile</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Sadece sana atanmış öğrenciler listelenir.</Text>

        <View style={styles.list}>
          {students.length === 0 ? (
            <Text style={styles.meta}>Henüz öğrencin yok.</Text>
          ) : (
            students.map((s) => (
              <View key={s.id} style={styles.card}>
                <Text style={styles.studentName}>{s.name || 'İsimsiz'}</Text>
                <Text style={styles.metaSmall}>
                  Yaş: {s.age || '-'} • Hedef: {s.goalType || '-'} • Program: {s.programId || '-'}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0b1220' },
  container: { flex: 1, padding: 24, gap: 12 },
  content: { padding: 20, gap: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#f8fafc' },
  subtitle: { fontSize: 14, color: '#cbd5e1' },
  list: { gap: 10, marginTop: 10 },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  studentName: { color: '#e2e8f0', fontWeight: '700', fontSize: 15 },
  metaSmall: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  meta: { color: '#94a3b8', fontSize: 13 },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#0ea5e9',
    borderRadius: 10,
  },
  refreshButtonText: { color: '#0b1120', fontWeight: '800' },
});
