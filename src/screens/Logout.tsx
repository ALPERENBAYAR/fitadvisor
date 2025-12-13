import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const KEYS_TO_CLEAR = [
  'fitadvisor:session',
  'fitadvisor:trainerSession',
  'fitadvisor:profile',
];

type LogoutProps = {
  onDone?: () => void;
};

export default function Logout({ onDone }: LogoutProps) {
  const [status, setStatus] = useState<'idle' | 'done'>('idle');
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await Promise.all(KEYS_TO_CLEAR.map((k) => AsyncStorage.removeItem(k)));
      setStatus('done');
      if (typeof onDone === 'function') {
        onDone();
      } else {
        router.replace('/'); // ana menü
      }
    } catch (e) {
      setStatus('done');
      if (typeof onDone === 'function') {
        onDone();
      } else {
        router.replace('/');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Çıkış Yap</Text>
        <Text style={styles.subtitle}>
          Oturumu kapatmak profil ve session bilgilerini temizler. İstediğin zaman tekrar giriş yapabilirsin.
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>{status === 'done' ? 'Çıkış Yapıldı' : 'Çıkış Yap'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 22,
  },
  button: {
    marginTop: 8,
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#0b1120',
    fontSize: 16,
    fontWeight: '800',
  },
});
