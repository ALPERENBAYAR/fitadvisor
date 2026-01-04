import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { loginWithUsername } from '../firebase/service';

type LoginProps = {
  onLoginSuccess?: () => void;
};

const PROFILE_STORAGE_KEY = 'fitadvisor:profile';
const SESSION_KEY = 'fitadvisor:session';

const ICON_CLOUD = [
  { name: 'dumbbell', size: 120, color: 'rgba(148,197,255,0.08)', top: -20, left: 18 },
  { name: 'heart-pulse', size: 140, color: 'rgba(148,197,255,0.06)', top: 20, right: 16 },
  { name: 'weight-lifter', size: 160, color: 'rgba(148,197,255,0.05)', bottom: -10, left: 12 },
  { name: 'run', size: 110, color: 'rgba(148,197,255,0.08)', bottom: 40, right: 24 },
];

export default function Login({ onLoginSuccess }: LoginProps) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Eksik bilgi', 'Kullanici adini ve sifreyi gir.');
      return;
    }
    setIsLoading(true);
    try {
      const data = await loginWithUsername(username.trim(), password, 'user');
      if (!data?.ok || !data?.user) {
        Alert.alert('Hatali giris', 'Kullanici adi veya sifre yanlis.');
        return;
      }
      const user = data.user;
      const profile = {
        age: user.age ?? '',
        height: user.height ?? '',
        weight: user.weight ?? '',
        gender: user.gender ?? '',
        goalType: user.goalType ?? user.goal ?? 'maintain',
        name: user.name,
        username: user.username,
        profilePhoto: user.profilePhoto || null,
      };
      const session = {
        userId: user.id,
        name: user.name,
        username: user.username,
        goal: user.goalType ?? '',
        programId: user.programId ?? null,
        assignedTrainerId: user.assignedTrainerId ?? null,
        profilePhoto: user.profilePhoto || null,
      };
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));

      const hasCompleteProfile =
        profile.age && profile.height && profile.weight && profile.gender && profile.goalType;
      const destination = hasCompleteProfile ? '/dashboard' : '/onboarding';
      router.replace(destination);
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess();
      }
    } catch {
      Alert.alert('Hata', 'Giris sirasinda bir sorun olustu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#0a1630', '#0c1d3c', '#0e2347']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
      <View style={styles.iconCloud}>
        {ICON_CLOUD.map((icon) => (
          <MaterialCommunityIcons
            key={icon.name}
            name={icon.name as any}
            size={icon.size}
            color={icon.color}
            style={[styles.iconCloudItem, { top: icon.top, left: icon.left, right: icon.right, bottom: icon.bottom }]}
          />
        ))}
      </View>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.logoWrap}>
              <View style={styles.logoRing} />
              <View style={styles.logoRingThin} />
              <View style={styles.badge}>
                <MaterialCommunityIcons name="run-fast" size={40} color="#e2e8f0" />
              </View>
            </View>
            <Text style={styles.title}>Fitness yolculuguna kaldigin yerden devam et.</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kullanici adi</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="alperen"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sifre</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                style={styles.input}
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
              <LinearGradient
                colors={['#22d3ee', '#0ea5e9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Giris yapiliyor...' : 'Giris Yap'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.link}>Hesabin yok mu? Hemen kaydol</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/trainer-login')}>
            <Text style={styles.helper}>Trainer girisi icin buraya tikla</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a1630',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
  },
  iconCloud: {
    ...StyleSheet.absoluteFillObject,
  },
  iconCloudItem: {
    position: 'absolute',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 40,
    gap: 18,
  },
  hero: {
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(20,184,166,0.1)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 28,
  },
  logoWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#22d3ee',
  },
  logoRingThin: {
    position: 'absolute',
    width: 98,
    height: 98,
    borderRadius: 49,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.5)',
  },
  badge: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 22,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    marginTop: 4,
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    color: '#f8fafc',
  },
  button: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
  },
  buttonText: {
    color: '#0b1120',
    fontSize: 16,
    fontWeight: '700',
  },
  helper: {
    marginTop: 10,
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
  },
  link: {
    marginTop: 12,
    fontSize: 13,
    color: '#38bdf8',
    fontWeight: '600',
    textAlign: 'center',
  },
});
