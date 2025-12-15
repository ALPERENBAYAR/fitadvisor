import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

type Profile = {
  age: string;
  height: string;
  weight: string;
  gender: string;
  goalType: string;
  profilePhoto?: string | null;
};

type ProfileScreenProps = {
  profile: Profile;
  onUpdateProfile: (profile: Profile) => void;
};

export default function ProfileScreen({ profile, onUpdateProfile }: ProfileScreenProps) {
  const [age, setAge] = useState(profile?.age ?? '');
  const [height, setHeight] = useState(profile?.height ?? '');
  const [weight, setWeight] = useState(profile?.weight ?? '');
  const [goalType, setGoalType] = useState(profile?.goalType ?? 'lose_weight');
  const [photo, setPhoto] = useState<string | null>(profile?.profilePhoto ?? null);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    setPhoto(profile?.profilePhoto ?? null);
    setAge(profile?.age ?? '');
    setHeight(profile?.height ?? '');
    setWeight(profile?.weight ?? '');
    setGoalType(profile?.goalType ?? 'lose_weight');
  }, [profile]);

  const handleSave = () => {
    const updated: Profile = {
      age: age.trim(),
      height: height.trim(),
      weight: weight.trim(),
      gender: profile?.gender ?? '',
      goalType,
      profilePhoto: photo,
    };
    if (typeof onUpdateProfile === 'function') {
      onUpdateProfile(updated);
      setSavedMessage('Profil bilgilerin güncellendi.');
      setTimeout(() => setSavedMessage(''), 2000);
    }
  };

  const renderGoalChip = (value: string, label: string) => {
    const active = goalType === value;
    return (
      <TouchableOpacity
        key={value}
        style={[styles.goalChip, active && styles.goalChipSelected]}
        onPress={() => setGoalType(value)}
        activeOpacity={0.85}
      >
        <Text style={[styles.goalChipText, active && styles.goalChipTextSelected]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const uri = asset.uri;
      const base64 = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : null;
      const nextPhoto = base64 || uri;
      setPhoto(nextPhoto);
      const updated: Profile = {
        age: age.trim(),
        height: height.trim(),
        weight: weight.trim(),
        gender: profile?.gender ?? '',
        goalType,
        profilePhoto: nextPhoto,
      };
      if (typeof onUpdateProfile === 'function') {
        onUpdateProfile(updated);
        setSavedMessage('Fotoğraf güncellendi.');
        setTimeout(() => setSavedMessage(''), 2000);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#0a1630', '#0c1e3e', '#0f254d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Profil</Text>
            <Text style={styles.title}>Bilgilerini güncelle, hedeflerini yenile.</Text>
            <Text style={styles.subtitle}>
              Koyu mavi + turkuaz temasıyla verilerini güncel tut ve kalorilerini daha iyi takip et.
            </Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeLabel}>Durum</Text>
            <Text style={styles.headerBadgeValue}>Aktif</Text>
          </View>
        </View>

        <View style={styles.avatarContainer}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>FA</Text>
            </View>
          )}
          <TouchableOpacity style={styles.photoButton} onPress={pickPhoto} activeOpacity={0.85}>
            <LinearGradient
              colors={['#14b8a6', '#0ea5e9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.photoButtonInner}
            >
              <Text style={styles.photoButtonText}>
                {photo ? 'Fotoğrafı değiştir' : 'Fotoğraf ekle'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Temel Bilgiler</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Yaş</Text>
            <TextInput
              value={age}
              onChangeText={setAge}
              placeholder="25"
              placeholderTextColor="#94a3b8"
              style={styles.input}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.row}>
            <View style={styles.halfInputGroup}>
              <Text style={styles.label}>Boy (cm)</Text>
              <TextInput
                value={height}
                onChangeText={setHeight}
                placeholder="175"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfInputGroup}>
              <Text style={styles.label}>Kilo (kg)</Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                placeholder="70"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Hedefin</Text>
          <Text style={styles.sectionHint}>
            Buradaki seçimin günlük adım, antrenman süresi ve su hedeflerine doğrudan etki eder.
          </Text>
          <View style={styles.goalRow}>
            {renderGoalChip('lose_weight', 'Kilo vermek')}
            {renderGoalChip('maintain', 'Formu korumak')}
            {renderGoalChip('gain_muscle', 'Kas kazanmak')}
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.9}>
          <LinearGradient
            colors={['#14b8a6', '#0ea5e9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveButtonInner}
          >
            <Text style={styles.saveButtonText}>Kaydet</Text>
          </LinearGradient>
        </TouchableOpacity>

        {savedMessage ? <Text style={styles.success}>{savedMessage}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const AVATAR_SIZE = width < 380 ? 96 : 120;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a1428',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: 'rgba(20,184,166,0.1)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.25)',
  },
  kicker: {
    fontSize: 13,
    color: '#9aa8be',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#e2e8f0',
  },
  subtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
    marginTop: 4,
  },
  headerBadge: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  headerBadgeLabel: {
    fontSize: 12,
    color: '#9aa8be',
  },
  headerBadgeValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#14b8a6',
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 14,
    gap: 12,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#13233f',
    borderWidth: 2,
    borderColor: '#14b8a6',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#e2e8f0',
    fontSize: 22,
    fontWeight: '800',
  },
  photoButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoButtonInner: {
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  photoButtonText: {
    color: '#0b1120',
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#0f1a2f',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  sectionHint: {
    fontSize: 12,
    color: '#9aa8be',
    lineHeight: 18,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  input: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    color: '#f8fafc',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInputGroup: {
    flex: 1,
    gap: 6,
  },
  goalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalChip: {
    backgroundColor: '#101a32',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
  },
  goalChipSelected: {
    borderColor: '#14b8a6',
    backgroundColor: 'rgba(20,184,166,0.12)',
  },
  goalChipText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  goalChipTextSelected: {
    color: '#34d399',
  },
  saveButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
  },
  saveButtonInner: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#0b1120',
    fontSize: 16,
    fontWeight: '800',
  },
  success: {
    marginTop: 8,
    fontSize: 12,
    color: '#34d399',
    textAlign: 'center',
  },
});
