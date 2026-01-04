import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ImageBackground,
} from 'react-native';

const { width } = Dimensions.get('window');
const containerWidth = Math.min(width * 0.92, 420);

const STORAGE_TODAY_KEY = 'fitadvisor:todayStats';
const EXERCISE_STORAGE_PREFIX = 'fitadvisor:exerciseLog:';
const PROFILE_STORAGE_KEY = 'fitadvisor:profile';

export default function CaloriesBurnedScreen() {
  const router = useRouter();
  const todayId = new Date().toISOString().slice(0, 10);
  const exerciseStorageKey = `${EXERCISE_STORAGE_PREFIX}${todayId}`;
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    steps: 0,
    workoutMinutes: 0,
    calories: 0,
  });
  const [exerciseLog, setExerciseLog] = useState({
    pushups: '',
    situps: '',
    ropeMinutes: '',
    plankMinutes: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const storedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (storedProfile) setProfile(JSON.parse(storedProfile));

        const storedStats = await AsyncStorage.getItem(STORAGE_TODAY_KEY);
        if (storedStats) {
          const parsed = JSON.parse(storedStats);
          if (parsed?.date === todayId && parsed?.stats) {
            setStats((prev) => ({
              ...prev,
              steps: parsed.stats.steps ?? prev.steps,
              workoutMinutes: parsed.stats.workoutMinutes ?? prev.workoutMinutes,
              calories: parsed.stats.calories ?? prev.calories,
            }));
          }
        }

        const storedExercise = await AsyncStorage.getItem(exerciseStorageKey);
        if (storedExercise) {
          const parsed = JSON.parse(storedExercise);
          setExerciseLog({
            pushups: parsed?.pushups ?? '',
            situps: parsed?.situps ?? '',
            ropeMinutes: parsed?.ropeMinutes ?? '',
            plankMinutes: parsed?.plankMinutes ?? '',
          });
        }
      } catch {
        // ignore
      }
    };
    load();
  }, [exerciseStorageKey, todayId]);

  const weightKg = profile?.weight ? Number(profile.weight) : null;
  const heightCm = profile?.height ? Number(profile.height) : null;
  const ageYears = profile?.age ? Number(profile.age) : null;
  const gender = profile?.gender || 'male';

  const basalCalories = useMemo(() => {
    if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm) || !Number.isFinite(ageYears)) {
      return 0;
    }
    const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
    const genderOffset = gender === 'female' ? -161 : 5;
    return Math.max(0, Math.round(base + genderOffset));
  }, [weightKg, heightCm, ageYears, gender]);

  const numericValue = (value: any) => {
    if (value === '') return 0;
    const parsed = Number(String(value).replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const calcCalories = {
    pushups: Number((numericValue(exerciseLog.pushups) * (weightKg || 0) * 0.004).toFixed(1)),
    situps: Number((numericValue(exerciseLog.situps) * (weightKg || 0) * 0.00222).toFixed(1)),
    rope: Number((numericValue(exerciseLog.ropeMinutes) * (weightKg || 0) * 0.207).toFixed(1)),
    plank: Number((numericValue(exerciseLog.plankMinutes) * (weightKg || 0) * 0.0665).toFixed(1)),
  };

  const exerciseBurn = useMemo(
    () => Number((calcCalories.pushups + calcCalories.situps + calcCalories.rope + calcCalories.plank).toFixed(1)),
    [calcCalories.pushups, calcCalories.situps, calcCalories.rope, calcCalories.plank]
  );

  const totalBurn = basalCalories + exerciseBurn;
  const message = totalBurn > 0 ? `You've burned ${totalBurn} kcal!` : "You've burned 0 kcal!";
  const biscuitCount = totalBurn > 0 ? Math.max(1, Math.round(totalBurn / 80)) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require('../../background.png')}
        style={styles.bgImage}
        imageStyle={styles.bgImageStyle}
        resizeMode="cover"
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.header, { width: containerWidth }]}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()}>
              <MaterialCommunityIcons name="chevron-left" size={28} color="#0b1120" />
            </TouchableOpacity>
            <View style={{ width: 28 }} />
          </View>

          <View style={[styles.cardPlain, { width: containerWidth }]}>
            <Text style={styles.cardId}>{profile?.username || 'fitadvisor'}</Text>
            <Text style={styles.cardDate}>{new Date().toDateString()}</Text>
            <Text style={styles.cardStats}>
              {stats.workoutMinutes || 0} m · {stats.steps || 0} steps
            </Text>
            <Text style={styles.cardMessage}>{message}</Text>
            <Text style={styles.cardSub}>Get up and move!</Text>
            {biscuitCount ? (
              <Text style={styles.cardBiscuit}>≈ {biscuitCount} bisküvi yakildi.</Text>
            ) : null}
            <View style={styles.cookieRow}>
              <MaterialCommunityIcons name="cookie" size={64} color="#f97316" />
            </View>
          </View>

        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const horizontalPadding = width < 380 ? 16 : 24;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  bgImage: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  bgImageStyle: {
    width: '100%',
    height: '100%',
  },
  content: {
    paddingHorizontal: horizontalPadding,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 14,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
  },
  cardPlain: {
    paddingVertical: 22,
    paddingHorizontal: 18,
    gap: 10,
    width: '100%',
    backgroundColor: 'transparent',
  },
  cardId: {
    color: '#0a0a0a',
    fontWeight: '800',
    fontSize: 16,
  },
  cardDate: {
    color: '#0f172a',
    fontSize: 12,
  },
  cardStats: {
    marginTop: 12,
    fontSize: 18,
    color: '#0a0a0a',
    fontWeight: '700',
  },
  cardMessage: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: '800',
    color: '#0a0a0a',
  },
  cardSub: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0a0a0a',
    marginTop: 6,
  },
  cardBiscuit: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  cookieRow: {
    marginTop: 18,
    alignItems: 'flex-start',
  },
  metaCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    color: '#e2e8f0',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    backgroundColor: '#0c1a32',
    alignItems: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: '#fb923c',
    borderColor: '#fb923c',
  },
  actionText: {
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 14,
  },
  actionTextPrimary: {
    color: '#0b1120',
  },
});
