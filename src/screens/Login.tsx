import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
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

export default function Login({ onLoginSuccess }: LoginProps) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Eksik bilgi', 'Kullanıcı adını ve şifreyi gir.');
      return;
    }
    setIsLoading(true);
    try {
      const data = await loginWithUsername(username.trim(), password, 'user');
      if (!data?.ok || !data?.user) {
        Alert.alert('Hatalı giriş', 'Kullanıcı adı veya şifre yanlış.');
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
    } catch (error) {
      Alert.alert('Hata', 'Giriş sırasında bir sorun oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.heroOverlay} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inner}>
          <Text style={styles.brand}>FitAdvisor</Text>
          <Text style={styles.subtitle}>Hesabına giriş yap</Text>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kullanıcı adı</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="alperen"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Şifre</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="123"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                style={styles.input}
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>{isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}</Text>
            </TouchableOpacity>

            <Text style={styles.helper}>Demo için kullanıcı: alperen | Şifre: 123</Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.link}>Hesabın yok mu? Oluştur</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  heroOverlay: {
    position: 'absolute',
    top: -120,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: '#0ea5e9',
    opacity: 0.18,
  },
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  brand: {
    fontSize: 34,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginTop: 12,
    shadowColor: '#020617',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 20,
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
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
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
