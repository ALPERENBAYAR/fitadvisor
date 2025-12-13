import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Image,
  Dimensions,
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

import { registerTrainer } from '../firebase/service';

const TRAINER_SESSION_KEY = 'fitadvisor:trainerSession';
const { width } = Dimensions.get('window');

type TrainerRegisterProps = {
  onSuccess?: () => void;
  onGoLogin?: () => void;
};

export default function TrainerRegister({ onSuccess, onGoLogin }: TrainerRegisterProps) {
  const [form, setForm] = useState({
    name: '',
    username: '',
    specialty: '',
    bio: '',
    password: '',
  });
  const [photo, setPhoto] = useState<{ uri: string; base64?: string } | null>(null);
  const [message, setMessage] = useState('');

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

  const handleSubmit = async () => {
    const { name, username, specialty, bio, password } = form;
    if (!name.trim() || !username.trim() || !specialty.trim() || !password.trim()) {
      setMessage('Lütfen zorunlu alanları doldur.');
      return;
    }
    try {
      const res = await registerTrainer({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        specialty: specialty.trim(),
        bio: bio.trim(),
        password: password.trim(),
        profilePhoto: photo?.base64 ? `data:image/jpeg;base64,${photo.base64}` : null,
      });
      if (!res?.ok || !res.trainer) {
        setMessage('Kayıt başarısız.');
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
      setMessage('Trainer oluşturuldu ve oturum açıldı.');
      setForm({ name: '', username: '', specialty: '', bio: '', password: '' });
      setPhoto(null);
      if (typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch {
      setMessage('Kayıt sırasında hata oluştu.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Personal Trainer Oluştur</Text>
          <Text style={styles.subtitle}>
            Uzmanlık alanlarını ekle, şifre Firebase Auth ile saklansın ve oturum açık kalsın.
          </Text>

          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ad Soyad</Text>
                <TextInput
                  value={form.name}
                  onChangeText={(v) => setForm((prev) => ({ ...prev, name: v }))}
                  placeholder="Ayşe Yılmaz"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Kullanıcı adı</Text>
                <TextInput
                  value={form.username}
                  onChangeText={(v) => setForm((prev) => ({ ...prev, username: v }))}
                  placeholder="ayse.trainer"
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
                <Text style={styles.label}>Uzmanlık</Text>
                <TextInput
                  value={form.specialty}
                  onChangeText={(v) => setForm((prev) => ({ ...prev, specialty: v }))}
                  placeholder="Strength / Mobility / Nutrition"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Bio</Text>
                <TextInput
                  value={form.bio}
                  onChangeText={(v) => setForm((prev) => ({ ...prev, bio: v }))}
                  placeholder="Kısa tanım"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
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
              <Text style={styles.buttonText}>Trainer Oluştur</Text>
            </TouchableOpacity>
            {message ? <Text style={styles.message}>{message}</Text> : null}
            {onGoLogin ? (
              <TouchableOpacity onPress={onGoLogin}>
                <Text style={styles.link}>Giriş ekranına dön</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const horizontalPadding = width < 380 ? 16 : 24;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b1220',
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
  link: {
    marginTop: 10,
    fontSize: 13,
    color: '#38bdf8',
    fontWeight: '600',
  },
});
