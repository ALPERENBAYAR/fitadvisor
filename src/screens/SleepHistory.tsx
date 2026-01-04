import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { getSleepEntriesForUser } from '../firebase/service';

const SESSION_KEY = 'fitadvisor:session';
const SLEEP_HISTORY_KEY = 'fitadvisor:sleepHistory';
const SLEEP_STORAGE_PREFIX = 'fitadvisor:sleep:';

type SleepEntryRow = {
  date: string;
  hours: number;
  source: string;
};

export default function SleepHistory() {
  const router = useRouter();
  const [entries, setEntries] = useState<SleepEntryRow[]>([]);
  const [status, setStatus] = useState('Yukleniyor...');

  useEffect(() => {
    const load = async () => {
      try {
        const storedSession = await AsyncStorage.getItem(SESSION_KEY);
        const parsed = storedSession ? JSON.parse(storedSession) : null;
        const userId = parsed?.userId;
        const entriesCombined: any[] = [];

        // remote fetch if session available
        if (userId) {
          const remote = await getSleepEntriesForUser(userId, 90);
          if (Array.isArray(remote)) entriesCombined.push(...remote);
        }

        // local history cache
        const localHistoryRaw = await AsyncStorage.getItem(SLEEP_HISTORY_KEY);
        const localHistory = localHistoryRaw ? JSON.parse(localHistoryRaw) : [];
        if (Array.isArray(localHistory)) entriesCombined.push(...localHistory);

        // today local snapshot
        const todayId = new Date().toISOString().slice(0, 10);
        const localTodayVal = await AsyncStorage.getItem(`${SLEEP_STORAGE_PREFIX}${todayId}`);
        if (localTodayVal !== null && localTodayVal !== undefined) {
          entriesCombined.push({
            date: todayId,
            hours: Number(localTodayVal) || 0,
            source: userId ? 'local' : 'anon-local',
            createdAt: Date.now(),
          });
        }

        if (entriesCombined.length === 0) {
          setStatus(userId ? 'Uyku kaydi bulunamadi.' : 'Oturum yok, yerel kayit bulunamadi.');
          return;
        }

        const seen: Record<string, boolean> = {};
        const deduped = entriesCombined
          .map((e) => ({
            ...e,
            createdAt: e.createdAt || 0,
          }))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
          .filter((e) => {
            const key = `${e.date}-${e.hours}-${e.source}`;
            if (seen[key]) return false;
            seen[key] = true;
            return true;
          });
        setEntries(deduped);
        setStatus('');
      } catch {
        setStatus('Uyku kayitlari okunamadi.');
      }
    };
    load();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#0a1630', '#0c1d3c', '#0e2347']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bg}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>{'<'} Geri</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Uyku Kayitlari</Text>
          <View style={{ width: 48 }} />
        </View>
        {status ? <Text style={styles.meta}>{status}</Text> : null}
        {entries.map((e) => (
          <View key={`${e.date}`} style={styles.row}>
            <View>
              <Text style={styles.date}>{e.date}</Text>
              <Text style={styles.meta}>Kaynak: {e.source}</Text>
            </View>
            <Text style={styles.hours}>{e.hours} saat</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0a1428' },
  bg: { ...StyleSheet.absoluteFillObject },
  content: { padding: 18, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { paddingVertical: 6, paddingRight: 12 },
  backText: { color: '#e2e8f0', fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '800', color: '#f8fafc' },
  meta: { color: '#94a3b8', fontSize: 12 },
  row: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: { color: '#e2e8f0', fontWeight: '700', fontSize: 14 },
  hours: { color: '#fef3c7', fontWeight: '800', fontSize: 16 },
});
