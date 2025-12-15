import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  getDailyCalories,
  getNotificationsForTrainer,
  getTrainerMessages,
  listUsers,
  updateTrainerProfile,
} from '../firebase/service';

const TRAINER_SESSION_KEY = 'fitadvisor:trainerSession';

type TrainerSession = {
  trainerId: string;
  name: string;
  username: string;
  specialty?: string;
  profilePhoto?: string | null;
};

export default function TrainerDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<TrainerSession | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [studentCalories, setStudentCalories] = useState<Record<string, { total: number; entries: any[] }>>({});

  const loadDashboard = async () => {
    try {
      const storedSession = await AsyncStorage.getItem(TRAINER_SESSION_KEY);
      let parsed: TrainerSession | null = null;
      if (storedSession) {
        parsed = JSON.parse(storedSession);
        setSession(parsed);
        setPhoto(parsed?.profilePhoto ?? null);
      }
      if (!parsed?.trainerId) return;

      const studentsData = await listUsers(parsed.trainerId);
      setStudents(studentsData);

      const today = new Date().toISOString().slice(0, 10);
      const calorieMap: Record<string, { total: number; entries: any[] }> = {};
      for (const s of studentsData) {
        if (s.id) {
          const cal = await getDailyCalories(s.id, today);
          if (cal.ok) {
            calorieMap[s.id] = { total: cal.total, entries: cal.entries || [] };
          }
        }
      }
      setStudentCalories(calorieMap);

      const notifData = await getNotificationsForTrainer(parsed.trainerId);
      const sortedNotifs = notifData.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
      setNotifications(sortedNotifs);

      const msgData = await getTrainerMessages(parsed.trainerId, 10);
      setMessages(msgData);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handlePickPhoto = async () => {
    if (!session?.trainerId) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const nextPhoto = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      setPhoto(nextPhoto);
      const nextSession = { ...session, profilePhoto: nextPhoto };
      setSession(nextSession);
      await AsyncStorage.setItem(TRAINER_SESSION_KEY, JSON.stringify(nextSession));
      await updateTrainerProfile(session.trainerId, { profilePhoto: nextPhoto });
    }
  };

  const clearNotification = async (notifId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
  };

  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Trainer Dashboard</Text>
          <Text style={styles.subtitle}>Oturum bulunamadı. Lütfen trainer hesabınla giriş yap.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#0a1630', '#0c1e3e', '#0f254d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Trainer Dashboard</Text>
            <Text style={styles.title}>Hoş geldin {session.name}</Text>
            <Text style={styles.subtitle}>Sadece sana bağlı öğrencileri ve günlük kalorilerini görüyorsun.</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.badgeLabel}>Öğrenci</Text>
            <Text style={styles.badgeValue}>{students.length}</Text>
          </View>
        </View>

        <View style={styles.profileRow}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{session.name?.[0]?.toUpperCase?.() || 'T'}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.meta}>Kullanıcı adı: {session.username}</Text>
            <Text style={styles.meta}>Uzmanlık: {session.specialty || 'Belirtilmedi'}</Text>
          </View>
          <TouchableOpacity style={styles.photoButton} onPress={handlePickPhoto}>
            <LinearGradient
              colors={['#14b8a6', '#0ea5e9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.photoButtonInner}
            >
              <Text style={styles.photoButtonText}>{photo ? 'Fotoğrafı değiştir' : 'Fotoğraf ekle'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickButton} onPress={() => router.push('/trainer-messages')}>
            <Text style={styles.quickText}>Mesajlar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickButton} onPress={() => router.push('/trainer-students')}>
            <Text style={styles.quickText}>Öğrenciler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickButton} onPress={() => router.push('/trainer-notifications')}>
            <Text style={styles.quickText}>Bildirimler</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{students.length}</Text>
            <Text style={styles.metricLabel}>Öğrenci</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{notifications.length}</Text>
            <Text style={styles.metricLabel}>Bildirim</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{messages.length}</Text>
            <Text style={styles.metricLabel}>Mesaj</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Bildirimler</Text>
          {notifications.length === 0 ? (
            <Text style={styles.meta}>Yeni bildirim yok.</Text>
          ) : (
            notifications.map((n) => (
              <View key={n.id} style={styles.notificationItem}>
                <Text style={styles.metaStrong}>Yeni atama isteği: {n.userName || 'Bilinmeyen kullanıcı'}</Text>
                <Text style={styles.metaSmall}>
                  Hedef: {n.userGoal || '-'} • Tarih: {new Date(n.createdAt).toLocaleString()}
                </Text>
                <TouchableOpacity style={styles.clearButton} onPress={() => clearNotification(n.id)}>
                  <Text style={styles.clearButtonText}>Okundu</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>Son Mesajlar</Text>
            <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/trainer-messages')}>
              <Text style={styles.linkButtonText}>Mesaj kutusuna git</Text>
            </TouchableOpacity>
          </View>
          {messages.length === 0 ? (
            <Text style={styles.meta}>Mesaj bulunamadı.</Text>
          ) : (
            messages.map((m) => (
              <View key={m.id} style={styles.notificationItem}>
                <Text style={styles.metaStrong}>
                  {m.senderId === session.trainerId ? 'Sen → Öğrenci' : 'Öğrenci → Sen'}
                </Text>
                <Text style={styles.metaSmall}>{m.text}</Text>
                <Text style={styles.metaSmall}>{new Date(m.createdAt || '').toLocaleString()}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>Öğrenciler</Text>
            <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/trainer-students')}>
              <Text style={styles.linkButtonText}>Tam liste</Text>
            </TouchableOpacity>
          </View>
          {students.length === 0 ? (
            <Text style={styles.meta}>Henüz sana atanan öğrenci yok.</Text>
          ) : (
            students.map((s) => (
              <View key={s.id} style={styles.studentItem}>
                <View style={styles.studentHeader}>
                  {s.profilePhoto ? (
                    <Image source={{ uri: s.profilePhoto }} style={styles.studentAvatar} />
                  ) : (
                    <View style={[styles.studentAvatar, styles.avatarFallback]}>
                      <Text style={styles.avatarInitial}>{(s.name || s.username || '?')[0]?.toUpperCase?.() || 'Ö'}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>{s.name || s.username || 'İsimsiz'}</Text>
                    <Text style={styles.metaSmall}>
                      Yaş: {s.age || '-'} • Hedef: {s.goal || s.goalType || '-'} • Program: {s.programId || '-'}
                    </Text>
                    <Text style={styles.metaSmall}>Bugün: {(studentCalories[s.id]?.total ?? 0).toFixed(0)} kcal</Text>
                  </View>
                </View>
                {studentCalories[s.id]?.entries?.length ? (
                  <View style={{ marginTop: 6, gap: 4 }}>
                    {studentCalories[s.id].entries.map((e: any, idx: number) => (
                      <View key={`${s.id}-cal-${idx}`} style={styles.foodRow}>
                        <Text style={styles.metaSmall}>{e.description || 'Öğe'}</Text>
                        <Text style={styles.metaSmall}>
                          {Math.round(e.calories || 0)} kcal{e.grams ? ` (${e.grams} g)` : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0a1428' },
  gradient: { ...StyleSheet.absoluteFillObject },
  container: { flex: 1, padding: 24, gap: 12 },
  content: { padding: 16, gap: 14 },
  header: {
    backgroundColor: 'rgba(20,184,166,0.1)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.25)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  kicker: { fontSize: 12, color: '#9aa8be', marginBottom: 2 },
  title: { fontSize: 22, fontWeight: '800', color: '#f8fafc' },
  subtitle: { fontSize: 14, color: '#cbd5e1', marginBottom: 8, lineHeight: 20 },
  headerBadge: { alignItems: 'flex-end', justifyContent: 'center', gap: 2 },
  badgeLabel: { fontSize: 12, color: '#9aa8be' },
  badgeValue: { fontSize: 16, fontWeight: '800', color: '#14b8a6' },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0f1a2f',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#16a34a',
    backgroundColor: '#1f2937',
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { fontSize: 24, color: '#e2e8f0' },
  photoButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoButtonInner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  photoButtonText: { color: '#0b1120', fontWeight: '800' },
  quickRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  quickButton: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
  },
  quickText: { color: '#e2e8f0', fontWeight: '700' },
  metricsRow: { flexDirection: 'row', gap: 12 },
  metricCard: {
    flex: 1,
    backgroundColor: '#0f1a2f',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
  },
  metricValue: { fontSize: 22, fontWeight: '800', color: '#f8fafc' },
  metricLabel: { fontSize: 12, color: '#94a3b8' },
  card: {
    backgroundColor: '#0f1a2f',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#e2e8f0' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linkButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  linkButtonText: { fontSize: 12, color: '#0b1120', fontWeight: '700' },
  meta: { fontSize: 13, color: '#cbd5e1' },
  metaStrong: { fontSize: 13, color: '#e2e8f0', fontWeight: '700' },
  metaSmall: { fontSize: 12, color: '#94a3b8' },
  notificationItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1f2937', gap: 4 },
  clearButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#0ea5e9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  clearButtonText: { fontSize: 12, color: '#0b1120', fontWeight: '700' },
  studentItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1f2937', gap: 2 },
  studentHeader: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#10b981',
    backgroundColor: '#1f2937',
  },
  studentName: { fontSize: 15, fontWeight: '700', color: '#e2e8f0' },
  foodRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
