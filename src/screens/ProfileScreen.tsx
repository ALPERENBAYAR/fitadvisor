import { useState } from 'react';
import {
  Dimensions,
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
  const [savedMessage, setSavedMessage] = useState('');

  const handleSave = () => {
    const updated: Profile = {
      age: age.trim(),
      height: height.trim(),
      weight: weight.trim(),
      gender: profile?.gender ?? '',
      goalType,
    };

    if (typeof onUpdateProfile === 'function') {
      onUpdateProfile(updated);
      setSavedMessage('Profil bilgilerin güncellendi. Hedeflerin buna göre yeniden hesaplandı.');
      setTimeout(() => setSavedMessage(''), 2500);
    }
  };

  const renderGoalChip = (value: string, label: string) => (
    <TouchableOpacity
      key={value}
      style={[styles.goalChip, goalType === value && styles.goalChipSelected]}
      onPress={() => setGoalType(value)}
      activeOpacity={0.8}
    >
      <Text style={[styles.goalChipText, goalType === value && styles.goalChipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profil</Text>
        <Text style={styles.subtitle}>
          Bilgilerini güncelleyerek hedeflerini yeniden hesaplayabilirsin.
        </Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Yaş</Text>
            <TextInput
              value={age}
              onChangeText={setAge}
              placeholder="25"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Boy (cm)</Text>
            <TextInput
              value={height}
              onChangeText={setHeight}
              placeholder="175"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kilo (kg)</Text>
            <TextInput
              value={weight}
              onChangeText={setWeight}
              placeholder="70"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hedefin</Text>
            <View style={styles.goalChipContainer}>
              {renderGoalChip('lose_weight', 'Kilo Vermek')}
              {renderGoalChip('gain_muscle', 'Kas Kazanmak')}
              {renderGoalChip('maintain', 'Koruma')}
            </View>
          </View>

          {savedMessage ? (
            <View style={styles.savedMessageContainer}>
              <Text style={styles.savedMessage}>{savedMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Kaydet</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const horizontalPadding = width < 380 ? 16 : 24;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#e5f2ff',
  },
  content: {
    paddingHorizontal: horizontalPadding,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 24,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  goalChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalChip: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  goalChipSelected: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  goalChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  goalChipTextSelected: {
    color: '#ffffff',
  },
  savedMessageContainer: {
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  savedMessage: {
    fontSize: 14,
    color: '#16a34a',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
