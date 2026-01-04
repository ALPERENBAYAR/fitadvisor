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
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { registerUser } from '../firebase/service';

const PROFILE_STORAGE_KEY = 'fitadvisor:profile';
const SESSION_KEY = 'fitadvisor:session';

type RegisterProps = {
  onSuccess?: () => void;
};

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
      setMessage('Lutfen tum alanlari doldur.');
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
        setMessage('Kayit basarisiz. Lutfen tekrar dene.');
        return;
      }
      await persistProfileAndSession(res.user);
      setMessage('Kullanici olusturuldu, oturum acildi.');
      setForm({ name: '', username: '', age: '', goal: '', programId: 'fullbody-3', password: '' });
      setPhoto(null);
      if (typeof onSuccess === 'function') {
        onSuccess();
      } else {
        router.replace('/dashboard');
      }
    } catch (e: any) {
      setMessage(e?.message || 'Kayit sirasinda hata olustu.');
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
              <View style={styles.logoWrap}>
                <View style={styles.logoRing} />
                <View style={styles.logoRingThin} />
                <View style={styles.logoBadge}>
                  <MaterialCommunityIcons name="run-fast" size={36} color="#e2e8f0" />
                </View>
              </View>
              <Text style={styles.heroTitle}>Yeni uyelik olustur</Text>
              <Text style={styles.badgeHint}>Guvenli kayit - Firebase Auth</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.photoCard}>
                <Text style={styles.label}>Profil fotografi (opsiyonel)</Text>
                <View style={styles.photoActions}>
                  {photo ? <Image source={{ uri: photo.uri }} style={styles.avatarLarge} /> : <View style={styles.avatarPlaceholder} />}
                  <TouchableOpacity style={styles.photoButton} onPress={pickPhoto}>
                    <Text style={styles.photoButtonText}>{photo ? 'Fotografi degistir' : 'Fotograf sec'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Ad Soyad</Text>
                  <TextInput
                    value={form.name}
                    onChangeText={(v) => setForm((prev) => ({ ...prev, name: v }))}
                    placeholder="Orn. Alperen Bayar"
                    placeholderTextColor="#9aa4b5"
                    style={styles.input}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Kullanici adi</Text>
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

              <View style={styles.row}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Yas</Text>
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
                <Text style={styles.label}>Sifre</Text>
                <TextInput
                  value={form.password}
                  onChangeText={(v) => setForm((prev) => ({ ...prev, password: v }))}
                  placeholder="********"
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
                <Text style={styles.buttonText}>Kayit Ol ve Basla</Text>
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
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  badgeHint: {
    color: '#9aa4b5',
    fontSize: 13,
  },
  logoWrap: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: '#22d3ee',
  },
  logoRingThin: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.5)',
  },
  logoBadge: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  logoBadgeText: {
    color: '#e2e8f0',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1.2,
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
  photoCard: {
    backgroundColor: 'rgba(12, 24, 40, 0.7)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
  },
  photoActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
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
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#14b8a6',
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(148,163,184,0.4)',
    backgroundColor: '#0b1220',
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

