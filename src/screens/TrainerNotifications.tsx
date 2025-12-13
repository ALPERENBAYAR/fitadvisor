import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { getNotificationsForTrainer } from '../firebase/service';

const TRAINER_SESSION_KEY = 'fitadvisor:trainerSession';

type TrainerSession = {
  trainerId: string;
  name: string;
  username: string;
};

type NotificationItem = {
  id: string;
  trainerId: string;
  userId?: string;
  userName?: string;
  userGoal?: string;
  createdAt?: number;
};

export default function TrainerNotifications() {
  const [session, setSession] = useState<TrainerSession | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const load = async () => {
    try {
      const storedSession = await AsyncStorage.getItem(TRAINER_SESSION_KEY);
      let parsed: TrainerSession | null = null;
      if (storedSession) {
        parsed = JSON.parse(storedSession);
        setSession(parsed);
      }
      if (!parsed?.trainerId) return;
      const data = await getNotificationsForTrainer(parsed.trainerId);
      const sorted = data.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
      setNotifications(sorted);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    load();
  }, []);

  const clearNotification = async (notifId: string) => {
    setNotifications((prev) => prev.filter((x) => x.id !== notifId));
  };

  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Trainer Bildirimleri</Text>
          <Text style={styles.subtitle}>Oturum bulunamadı. Lütfen trainer hesabınla giriş yap.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Trainer Bildirimleri</Text>
        <Text style={styles.subtitle}>Merhaba {session.name}, sana gelen atama istekleri burada.</Text>

        <View style={styles.card}>
          {notifications.length === 0 ? (
            <Text style={styles.meta}>Yeni bildirim yok.</Text>
          ) : (
            notifications.map((n) => (
              <View key={n.id} style={styles.notificationItem}>
                <Text style={styles.metaStrong}>
                  Yeni atama isteği: {n.userName || 'Bilinmeyen kullanıcı'}
                </Text>
                <Text style={styles.metaSmall}>Hedef: {n.userGoal || '-'}</Text>
                <Text style={styles.metaSmall}>
                  Tarih: {n.createdAt ? new Date(n.createdAt).toLocaleString() : '-'}
                </Text>
                <TouchableOpacity style={styles.clearButton} onPress={() => clearNotification(n.id)}>
                  <Text style={styles.clearButtonText}>Gizle</Text>
                </TouchableOpacity>
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
  title: { fontSize: 24, fontWeight: '800', color: '#f8fafc' },
  subtitle: { fontSize: 14, color: '#cbd5e1' },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: 10,
  },
  notificationItem: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: 4,
  },
  meta: { color: '#94a3b8', fontSize: 13 },
  metaStrong: { color: '#e2e8f0', fontSize: 14, fontWeight: '700' },
  metaSmall: { color: '#94a3b8', fontSize: 12 },
  clearButton: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#0ea5e9',
  },
  clearButtonText: { color: '#0b1120', fontWeight: '800' },
});
