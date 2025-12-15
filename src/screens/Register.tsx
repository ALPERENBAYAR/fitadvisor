import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
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
      // ignore local errors
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
        setMessage('Kayıt başarısız. Lütfen tekrar dene.');
        return;
      }
      await persistProfileAndSession(res.user);
      setMessage('Kullanıcı oluşturuldu, oturum açıldı.');
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
    <LinearGradient
      colors={['#07142b', '#0a1a36', '#0c1f40']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.hero}>
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>FitAdvisor</Text>
                </View>
                <Text style={styles.badgeHint}>Güvenli kayıt • Firebase Auth</Text>
              </View>
              <Text style={styles.heroTitle}>Yeni üyelik oluştur</Text>
              <Text style={styles.heroSubtitle}>
                Kişisel hedeflerini gir, programını seç ve profil fotoğrafını ekle. Hepsi tek ekranda.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Ad Soyad</Text>
                  <TextInput
                    value={form.name}
                    onChangeText={(v) => setForm((prev) => ({ ...prev, name: v }))}
                    placeholder="Örn. Alperen Bayar"
                    placeholderTextColor="#9aa4b5"
                    style={styles.input}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Kullanıcı adı</Text>
                  <TextInput
                    value={form.username}
                    onChangeText={(v) => setForm((prev) => ({ ...prev, username: v }))}
                    placeholder="ornek.kullanici"
                    placeholderTextColor="#9aa4b5"
                    autoCapitalize="none"
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Profil fotoğrafı (opsiyonel)</Text>
                <View style={styles.photoRow}>
                  <TouchableOpacity style={styles.photoButton} onPress={pickPhoto}>
                    <Text style={styles.photoButtonText}>{photo ? 'Fotoğrafı değiştir' : 'Fotoğraf seç'}</Text>
                  </TouchableOpacity>
                  {photo ? <Image source={{ uri: photo.uri }} style={styles.avatar} /> : null}
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Yaş</Text>
                  <TextInput
                    value={form.age}
                    onChangeText={(v) => setForm((prev) => ({ ...prev, age: v }))}
                    placeholder="25"
                    placeholderTextColor="#9aa4b5"
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Hedef</Text>
                  <TextInput
                    value={form.goal}
                    onChangeText={(v) => setForm((prev) => ({ ...prev, goal: v }))}
                    placeholder="Kilo verme / Formu koruma / Kas kazanma"
                    placeholderTextColor="#9aa4b5"
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Program</Text>
                <View style={styles.programRow}>
                  {PROGRAMS.map((item) => {
                    const active = item.id === form.programId;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.programChip, active && styles.programChipActive]}
                        onPress={() => setForm((prev) => ({ ...prev, programId: item.id }))}
                      >
                        <Text
                          style={[styles.programChipText, active && styles.programChipTextActive]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Şifre</Text>
                <TextInput
                  value={form.password}
                  onChangeText={(v) => setForm((prev) => ({ ...prev, password: v }))}
                  placeholder="••••••••"
                  placeholderTextColor="#9aa4b5"
                  secureTextEntry
                  style={styles.input}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <LinearGradient
                colors={['#14b8a6', '#0ea5e9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Kayıt Ol ve Başla</Text>
              </LinearGradient>
            </TouchableOpacity>

            {message ? (
              <View style={styles.messageBox}>
                <Text style={styles.message}>{message}</Text>
              </View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const horizontalPadding = 24;

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: horizontalPadding,
    paddingTop: 28,
    paddingBottom: 36,
    gap: 16,
  },
  hero: {
    backgroundColor: 'rgba(20,184,166,0.08)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.28)',
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    backgroundColor: 'rgba(14,165,233,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.35)',
  },
  badgeText: {
    color: '#e0f2fe',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.4,
  },
  badgeHint: {
    color: '#9aa4b5',
    fontSize: 13,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#e2e8f0',
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#b8c4d7',
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 24,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: '#cbd5e1',
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: '#0b1220',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
    color: '#f8fafc',
    fontSize: 15,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  photoButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  photoButtonText: {
    color: '#0b1220',
    fontWeight: '700',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#14b8a6',
  },
  programRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  programChip: {
    backgroundColor: '#0b1220',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
  },
  programChipActive: {
    borderColor: '#14b8a6',
    backgroundColor: 'rgba(20,184,166,0.12)',
  },
  programChipText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
  },
  programChipTextActive: {
    color: '#34d399',
  },
  button: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 14,
  },
  buttonText: {
    color: '#0b1220',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  messageBox: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  message: {
    fontSize: 13,
    color: '#e2e8f0',
  },
});
