import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { assignTrainerToUser, listTrainers } from '../firebase/service';

const TRAINERS_KEY = 'fitadvisor:trainers';
const SESSION_KEY = 'fitadvisor:session';
const PROFILE_STORAGE_KEY = 'fitadvisor:profile';

export default function PersonalTrainers() {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const storedSession = await AsyncStorage.getItem(SESSION_KEY);
        if (storedSession) setSession(JSON.parse(storedSession));
      } catch {
        // ignore
      }
      try {
        const remote = await listTrainers();
        setTrainers(remote);
        await AsyncStorage.setItem(TRAINERS_KEY, JSON.stringify(remote));
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  const assignTrainer = async (trainerId: string, trainerName: string) => {
    if (!session?.userId) {
      setMessage('Önce kullanıcı olarak giriş yapmalısın.');
      return;
    }
    try {
      const res = await assignTrainerToUser(session.userId, trainerId);
      if (!res?.ok) {
        setMessage('Trainer atanamadı.');
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
      setMessage('Trainer atandı, bildiriminiz iletildi.');
    } catch {
      setMessage('Trainer atanırken hata oluştu.');
    }
  };

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
            <Text style={styles.kicker}>Trainer Seç</Text>
            <Text style={styles.title}>Sana en uygun trainerı ata.</Text>
            <Text style={styles.subtitle}>
              Koyu mavi + turkuaz temasında aktif trainer listesini gör ve birini seç.
            </Text>
          </View>
        </View>

        <View style={styles.list}>
          {trainers.length === 0 ? (
            <Text style={styles.meta}>Kayıtlı trainer yok.</Text>
          ) : (
            trainers.map((trainer) => (
              <View key={trainer.id} style={styles.item}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{trainer.name || trainer.username}</Text>
                  <Text style={styles.meta}>{trainer.specialty || 'Uzmanlık bilgisi yok'}</Text>
                </View>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => assignTrainer(trainer.id, trainer.name || trainer.username)}
                >
                  <LinearGradient
                    colors={['#14b8a6', '#0ea5e9']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buttonInner}
                  >
                    <Text style={styles.buttonText}>Ata</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0a1428' },
  gradient: { ...StyleSheet.absoluteFillObject },
  content: { padding: 16, gap: 14 },
  header: {
    backgroundColor: 'rgba(20,184,166,0.1)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.25)',
  },
  kicker: { fontSize: 12, color: '#9aa8be', marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#f8fafc' },
  subtitle: { fontSize: 14, color: '#cbd5e1', marginTop: 4, lineHeight: 20 },
  list: { gap: 10, marginTop: 10 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#0f1a2f',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
  },
  name: { color: '#e2e8f0', fontWeight: '700', fontSize: 15 },
  meta: { color: '#94a3b8', fontSize: 12 },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonInner: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#0b1120', fontWeight: '800' },
  message: { marginTop: 10, color: '#cbd5e1', fontSize: 13 },
});
