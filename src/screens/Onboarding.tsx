import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
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

type OnboardingProps = {
  onComplete: (profile: Profile) => void;
};

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('');
  const [goalType, setGoalType] = useState('');
  const hasAutoCompleted = useRef(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem('fitadvisor:profile');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed) {
            setAge(parsed.age ?? '');
            setHeight(parsed.height ?? '');
            setWeight(parsed.weight ?? '');
            setGender(parsed.gender ?? '');
            setGoalType(parsed.goalType ?? '');
            if (
              parsed.age &&
              parsed.height &&
              parsed.weight &&
              parsed.gender &&
              parsed.goalType &&
              !hasAutoCompleted.current &&
              typeof onComplete === 'function'
            ) {
              hasAutoCompleted.current = true;
              onComplete({
                age: String(parsed.age),
                height: String(parsed.height),
                weight: String(parsed.weight),
                gender: parsed.gender,
                goalType: parsed.goalType,
              });
            }
          }
        } else {
          // eğer profil yoksa burada kal
        }
      } catch {
        // ignore load errors
      }
    };
    loadProfile();
  }, [onComplete]);

  const handleContinue = () => {
    const profile = { age, height, weight, gender, goalType };
    if (typeof onComplete === 'function') {
      onComplete(profile);
    }
  };

  const selectGoal = (value: string) => {
    setGoalType(value);
  };

  const selectGender = (value: string) => {
    setGender(value);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.appName}>FitAdvisor</Text>
          <Text style={styles.title}>Kendini Tanıt</Text>
          <Text style={styles.subtitle}>
            Senin için en uygun günlük sağlık ve fitness hedeflerini belirleyelim.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Temel Bilgiler</Text>

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

          <Text style={styles.sectionTitle}>Cinsiyet</Text>
          <View style={styles.optionsContainer}>
            {[
              { key: 'male', label: 'Erkek' },
              { key: 'female', label: 'Kadın' },
              { key: 'other', label: 'Diğer' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.optionButton,
                  gender === option.key && styles.optionButtonSelected,
                ]}
                onPress={() => selectGender(option.key)}
              >
                <Text
                  style={[
                    styles.optionText,
                    gender === option.key && styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Hedefin</Text>
          <View style={styles.optionsContainer}>
            {[
              { key: 'lose_weight', label: 'Kilo Vermek' },
              { key: 'gain_muscle', label: 'Kas Kazanmak' },
              { key: 'maintain', label: 'Koruma' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.optionButton,
                  goalType === option.key && styles.optionButtonSelected,
                ]}
                onPress={() => selectGoal(option.key)}
              >
                <Text
                  style={[
                    styles.optionText,
                    goalType === option.key && styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.continueButton,
              age && height && weight && gender && goalType && styles.continueButtonActive,
            ]}
            onPress={handleContinue}
            disabled={!age || !height || !weight || !gender || !goalType}
          >
            <Text style={styles.continueButtonText}>Devam Et</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#e5f2ff',
  },
  scrollContent: {
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    gap: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
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
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  optionButtonSelected: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  optionTextSelected: {
    color: '#ffffff',
  },
  continueButton: {
    backgroundColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  continueButtonActive: {
    backgroundColor: '#16a34a',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
