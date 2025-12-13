import AsyncStorage from '@react-native-async-storage/async-storage';
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
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Personal Trainerlar</Text>
        <Text style={styles.subtitle}>
          Aktif trainer listesini gör ve kendine bir trainer ata.
        </Text>

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
                  <Text style={styles.buttonText}>Ata</Text>
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
  safeArea: { flex: 1, backgroundColor: '#0b1220' },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#f8fafc' },
  subtitle: { fontSize: 14, color: '#cbd5e1' },
  list: { gap: 10, marginTop: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: 10,
  },
  name: { color: '#e2e8f0', fontWeight: '700', fontSize: 15 },
  meta: { color: '#94a3b8', fontSize: 12 },
  button: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  buttonText: { color: '#0b1120', fontWeight: '800' },
  message: { marginTop: 10, color: '#cbd5e1', fontSize: 13 },
});
