import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import {
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

const TRAINER_SESSION_KEY = 'fitadvisor:trainerSession';

type TrainerLoginProps = {
  onSuccess?: () => void;
  onGoRegister?: () => void;
};

export default function TrainerLogin({ onSuccess, onGoRegister }: TrainerLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      alert('Kullanıcı adını ve şifreyi gir.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await loginWithUsername(username.trim(), password, 'trainer');
      if (!res?.ok || !res?.trainer) {
        alert('Trainer bulunamadı ya da bilgiler hatalı.');
        return;
      }
      const trainer = res.trainer;
      await AsyncStorage.setItem(
        TRAINER_SESSION_KEY,
        JSON.stringify({
          trainerId: trainer.id,
          name: trainer.name,
          username: trainer.username,
          specialty: trainer.specialty,
          profilePhoto: trainer.profilePhoto || null,
        })
      );
      if (typeof onSuccess === 'function') onSuccess();
    } catch (e) {
      alert('Giriş sırasında bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inner}>
          <Text style={styles.title}>Personal Trainer Girişi</Text>
          <Text style={styles.subtitle}>Trainer hesabınla giriş yap veya yeni hesap oluştur.</Text>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kullanıcı adı</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="ayse.trainer"
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
                placeholder="******"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                style={styles.input}
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>{isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}</Text>
            </TouchableOpacity>
            {onGoRegister ? (
              <TouchableOpacity onPress={onGoRegister}>
                <Text style={styles.link}>Hesabın yok mu? Oluştur</Text>
              </TouchableOpacity>
            ) : null}
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
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 4,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    shadowColor: '#020617',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: '#cbd5e1',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
    color: '#f8fafc',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#0b1120',
    fontSize: 16,
    fontWeight: '800',
  },
  link: {
    marginTop: 10,
    fontSize: 13,
    color: '#38bdf8',
    fontWeight: '600',
  },
});
