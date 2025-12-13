import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Image,
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

import { registerUser } from '../firebase/service';

const PROFILE_STORAGE_KEY = 'fitadvisor:profile';
const SESSION_KEY = 'fitadvisor:session';

type RegisterProps = {
  onSuccess?: () => void;
};

const PROGRAMS = [
  { id: 'fullbody-3', label: 'Full Body 3 Gün' },
  { id: 'split-4', label: 'Split 4 Gün' },
  { id: 'fitadvisor-5', label: 'FitAdvisor Performans 5 Gün' },
];

const goalToGoalType = (goal: string) => {
  const normalized = goal.toLowerCase();
  if (normalized.includes('kas')) return 'gain_muscle';
  if (normalized.includes('koru')) return 'maintain';
  return 'lose_weight';
};

export default function Register({ onSuccess }: RegisterProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    username: '',
    age: '',
    goal: '',
    programId: 'fullbody-3',
    password: '',
  });
  const [photo, setPhoto] = useState<{ uri: string; base64?: string } | null>(null);
  const [message, setMessage] = useState('');

  const persistProfileAndSession = async (user: any) => {
    const profile = {
      age: user.age || '',
      height: user.height || '',
      weight: user.weight || '',
      gender: user.gender || '',
      goalType: goalToGoalType(user.goalType || user.goal || ''),
      name: user.name,
      username: user.username,
      profilePhoto: user.profilePhoto || null,
    };
    const session = {
      userId: user.id,
      name: user.name,
      username: user.username,
      goal: user.goalType || '',
      programId: user.programId || '',
      assignedTrainerId: user.assignedTrainerId || null,
      profilePhoto: user.profilePhoto || null,
    };
    try {
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      // ignore
    }
  };

  const handleSubmit = async () => {
    const { name, username, age, goal, programId, password } = form;
    if (!name.trim() || !username.trim() || !age.trim() || !goal.trim() || !password.trim()) {
      setMessage('Lütfen tüm alanları doldur.');
      return;
    }
    try {
      const res = await registerUser({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        password: password.trim(),
        age,
        goalType: goalToGoalType(goal),
        programId,
        profilePhoto: photo?.base64 ? `data:image/jpeg;base64,${photo.base64}` : null,
      });
      if (!res?.ok || !res.user) {
        setMessage('Kayıt başarısız.');
        return;
      }
      await persistProfileAndSession(res.user);
      setMessage('Kullanıcı oluşturuldu. Oturum başlatıldı.');
      setForm({ name: '', username: '', age: '', goal: '', programId: 'fullbody-3', password: '' });
      setPhoto(null);
      if (typeof onSuccess === 'function') {
        onSuccess();
      } else {
        router.replace('/dashboard');
      }
    } catch (e: any) {
      setMessage(e?.message || 'Kayıt sırasında hata oluştu.');
    }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.4,
      base64: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setPhoto({ uri: asset.uri, base64: asset.base64 });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Yeni Kullanıcı Oluştur</Text>
          <Text style={styles.subtitle}>
            Bilgileri doldur, şifre Firebase Auth ile güvenli biçimde kaydedilsin ve oturum açık
            kalsın.
          </Text>

          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ad</Text>
                <TextInput
                  value={form.name}
                  onChangeText={(v) => setForm((prev) => ({ ...prev, name: v }))}
                  placeholder="İsim"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Kullanıcı adı</Text>
                <TextInput
                  value={form.username}
                  onChangeText={(v) => setForm((prev) => ({ ...prev, username: v }))}
                  placeholder="ornek.kullanici"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Profil fotoğrafı (opsiyonel)</Text>
              <TouchableOpacity style={styles.photoButton} onPress={pickPhoto}>
                <Text style={styles.photoButtonText}>{photo ? 'Fotoğrafı değiştir' : 'Fotoğraf seç'}</Text>
              </TouchableOpacity>
              {photo ? <Image source={{ uri: photo.uri }} style={styles.avatar} /> : null}
            </View>

            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Yaş</Text>
                <TextInput
                  value={form.age}
                  onChangeText={(v) => setForm((prev) => ({ ...prev, age: v }))}
                  placeholder="25"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Hedef</Text>
                <TextInput
                  value={form.goal}
                  onChangeText={(v) => setForm((prev) => ({ ...prev, goal: v }))}
                  placeholder="Kilo koruma / Kas kazanma / Performans"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Program</Text>
              <View style={styles.programRow}>
                {PROGRAMS.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.programChip, form.programId === p.id && styles.programChipActive]}
                    onPress={() => setForm((prev) => ({ ...prev, programId: p.id }))}
                  >
                    <Text
                      style={[styles.programChipText, form.programId === p.id && styles.programChipTextActive]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Şifre</Text>
              <TextInput
                value={form.password}
                onChangeText={(v) => setForm((prev) => ({ ...prev, password: v }))}
                placeholder="******"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                style={styles.input}
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Kayıt Ol ve Oturum Aç</Text>
            </TouchableOpacity>
            {message ? <Text style={styles.message}>{message}</Text> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const horizontalPadding = 24;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: horizontalPadding,
    paddingTop: 24,
    paddingBottom: 32,
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
  row: {
    flexDirection: 'row',
    gap: 10,
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
  programRow: {
    gap: 8,
  },
  programChip: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  programChipActive: {
    borderColor: '#10b981',
    backgroundColor: '#0f172a',
  },
  programChipText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  programChipTextActive: {
    color: '#10b981',
  },
  photoButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  photoButtonText: {
    color: '#0b1120',
    fontWeight: '700',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#0b1120',
    fontSize: 16,
    fontWeight: '800',
  },
  message: {
    fontSize: 12,
    color: '#cbd5e1',
  },
});
