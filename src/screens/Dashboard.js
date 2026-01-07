import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'expo-router';
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
import { useFocusEffect } from '@react-navigation/native';
import { getSleepEntryForDate, saveSleepEntry } from '../firebase/service';

const { width } = Dimensions.get('window');
const heroArcWidth = Math.min(width * 1.05, 580);
const heroArcHeight = Math.round(heroArcWidth * 0.6);

const STORAGE_TODAY_KEY = 'fitadvisor:todayStats';
const STORAGE_DATA_SOURCE_KEY = 'fitadvisor:dataSource';
const STORAGE_FORM_LOG_KEY = 'fitadvisor:formLog';
const WATCH_SNAPSHOT_KEY = 'fitadvisor:watchSnapshot';
const WATER_STORAGE_PREFIX = 'fitadvisor:water:';
const EXERCISE_STORAGE_PREFIX = 'fitadvisor:exerciseLog:';
const SLEEP_STORAGE_PREFIX = 'fitadvisor:sleep:';
const SLEEP_HISTORY_KEY = 'fitadvisor:sleepHistory';
const SESSION_KEY = 'fitadvisor:session';
const TRAINERS_KEY = 'fitadvisor:trainers';
const TRAINER_CARD_WIDTH = 100;

const ICON_CLOUD = [
  { name: 'dumbbell', size: 130, color: 'rgba(148,197,255,0.08)', top: -20, left: 10 },
  { name: 'heart-pulse', size: 150, color: 'rgba(148,197,255,0.06)', top: 18, right: 14 },
  { name: 'weight-lifter', size: 180, color: 'rgba(148,197,255,0.05)', bottom: -20, left: 12 },
  { name: 'run', size: 120, color: 'rgba(148,197,255,0.08)', bottom: 38, right: 20 },
];

export default function Dashboard({ profile, goals }) {
  const router = useRouter();
  const [todayStats, setTodayStats] = useState({
    steps: 0,
    stepsTarget: goals?.stepsTarget ?? 8000,
    workoutMinutes: 15,
    workoutTarget: goals?.workoutMinutesTarget ?? 30,
    waterLiters: 0.8,
    waterTarget: 2,
    calories: 0,
    caloriesTarget: 2000,
  });
  const [dataSource, setDataSource] = useState('manual');
  const [watchAvgHr, setWatchAvgHr] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const [exerciseLog, setExerciseLog] = useState({
    pushups: '',
    situps: '',
    ropeMinutes: '',
    plankMinutes: '',
  });
  const [isExerciseHydrated, setIsExerciseHydrated] = useState(false);
  const [sleepHours, setSleepHours] = useState('');
  const [sleepStatus, setSleepStatus] = useState('');
  const [sessionUserId, setSessionUserId] = useState(null);
  const [isSleepHydrated, setIsSleepHydrated] = useState(false);
  const [trainerPreview, setTrainerPreview] = useState([]);
  const fallbackTrainers = [
    { id: 't1', name: 'Ayse Yılmaz', specialty: 'Kuvvet', profilePhoto: null },
    { id: 't2', name: 'Mehmet Demir', specialty: 'Kardiyo', profilePhoto: null },
    { id: 't3', name: 'Selin Aksoy', specialty: 'Mobilite', profilePhoto: null },
  ];
  const trainerTrack = useMemo(
    () => (trainerPreview.length > 1 ? [...trainerPreview, ...trainerPreview] : trainerPreview),
    [trainerPreview]
  );

  const userName = profile?.name || 'Alperen';
  const weightKg = profile?.weight ? Number(profile.weight) : null;
  const waterTarget = Number.isFinite(weightKg)
    ? Number((weightKg * 0.04).toFixed(1))
    : (goals?.waterTargetLiters ?? 2);

  const todayId = new Date().toISOString().slice(0, 10);
  const waterStorageKey = `${WATER_STORAGE_PREFIX}${todayId}`;
  const exerciseStorageKey = `${EXERCISE_STORAGE_PREFIX}${todayId}`;
  const sleepStorageKey = `${SLEEP_STORAGE_PREFIX}${todayId}`;
  const watchReady = todayStats.steps > 0 || (Number.isFinite(watchAvgHr) && watchAvgHr > 0);
  const displaySteps = watchReady ? todayStats.steps : 0;
  const caloriesRatio = todayStats.caloriesTarget
    ? (todayStats.calories || 0) / todayStats.caloriesTarget
    : 0;
  const heightCm = profile?.height ? Number(profile.height) : null;
  const ageYears = profile?.age ? Number(profile.age) : null;
  const gender = profile?.gender || 'male';

  const basalCalories = (() => {
    if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm) || !Number.isFinite(ageYears)) {
      return 0;
    }
    const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
    const genderOffset = gender === 'female' ? -161 : 5;
    return Math.max(0, Math.round(base + genderOffset));
  })();

  const numericValue = (value) => {
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
  const exerciseBurn = Number(
    (calcCalories.pushups + calcCalories.situps + calcCalories.rope + calcCalories.plank).toFixed(1)
  );
  const totalBurn = basalCalories + exerciseBurn;
  const netCalories = Number(((todayStats.calories || 0) - totalBurn).toFixed(1));

  const buildTodayPlan = ({ steps, avgHr, caloriesRatio, stepsTarget }) => {
    const lowSteps = stepsTarget ? steps < stepsTarget * 0.6 : steps < 5000;
    const highSteps = stepsTarget ? steps >= stepsTarget * 1.2 : steps >= 14000;
    const highHr = avgHr >= 85;
    const midHr = avgHr >= 75;

    if (steps === 0 && avgHr === 0) {
      return {
        intensity: 'Dusuk',
        title: 'Veri bekleniyor',
        subtitle: 'Saat verisi gelince gunluk program netlesir.',
        items: [
          { title: '5-10 dk hafif yuruyus', meta: 'Isinma' },
          { title: 'Mobilite ve esneme', meta: 'Kalca, bel, omuz' },
          { title: 'Nefes egzersizi', meta: '2-3 dk' },
        ],
      };
    }

    if (caloriesRatio >= 1.1 && lowSteps) {
      return {
        intensity: 'Dusuk',
        title: 'Aktif toparlanma',
        subtitle: 'Kalori yuksek, hareket dusuk. Bugun daha yavas bir tempo.',
        items: [
          { title: '20 dk tempolu yuruyus', meta: 'Rahat tempo' },
          { title: 'Core + esneme', meta: '10-12 dk' },
          { title: 'Kisa soguma', meta: '5 dk' },
        ],
      };
    }

    if (caloriesRatio <= 0.8 && lowSteps) {
      return {
        intensity: 'Orta',
        title: 'Kisa aktivasyon',
        subtitle: 'Kalori dusuk ve hareket az. Kisa ama etkili bir seans.',
        items: [
          { title: 'Isinma yuruyusu', meta: '8-10 dk' },
          { title: 'Vucut agirligi seti', meta: '2-3 tur' },
          { title: 'Esneme', meta: '5 dk' },
        ],
      };
    }

    if (highSteps && highHr) {
      return {
        intensity: 'Yuksek',
        title: 'Tempo + interval',
        subtitle: 'Aktivite yuksek. Bugun hizli ve kontrollu bir tempo.',
        items: [
          { title: '10 dk isinma', meta: 'Hafif tempo' },
          { title: '4-6 interval seti', meta: '1 dk hizli + 2 dk aktif' },
          { title: 'Soguma', meta: '5-8 dk' },
        ],
      };
    }

    if (highSteps || midHr) {
      return {
        intensity: 'Orta',
        title: 'Dengeli full body',
        subtitle: 'Bugun dengeli bir guc + kardiyo plani.',
        items: [
          { title: 'Isinma', meta: '5-7 dk' },
          { title: 'Full body devre', meta: '25-30 dk' },
          { title: 'Esneme', meta: '5 dk' },
        ],
      };
    }

    return {
      intensity: 'Dusuk',
      title: 'Hafif hareket',
      subtitle: 'Bugun hafif tempo ile devam et.',
      items: [
        { title: 'Yuruyus', meta: '15-20 dk' },
        { title: 'Mobilite', meta: '8-10 dk' },
        { title: 'Soguma', meta: '3-5 dk' },
      ],
    };
  };

  const todayPlan = buildTodayPlan({
    steps: displaySteps,
    avgHr: watchAvgHr || 0,
    caloriesRatio,
    stepsTarget: todayStats.stepsTarget,
  });

  const buildAdviceBullets = () => {
    const bullets = [];
    if (Number.isFinite(weightKg) && Number.isFinite(heightCm) && heightCm > 0) {
      const heightM = heightCm / 100;
      const minWeight = Number((18.5 * heightM * heightM).toFixed(1));
      const maxWeight = Number((24.9 * heightM * heightM).toFixed(1));
      const isUnder = weightKg < minWeight;
      const isOver = weightKg > maxWeight;

      if (isOver && netCalories > 0) {
        bullets.push('Ideal kilonun uzerindesin ve kalori fazlan var. Bunu kalori acigina cevirmen gerekir.');
      } else if (isOver && netCalories <= 0) {
        bullets.push('Ideal kilonun uzerindesin ve kalori acigin var. Bu sekilde devam edebilirsin.');
      } else if (isUnder && netCalories < 0) {
        bullets.push('Ideal kilonun altindasin ve kalori acigin var. Dengeli sekilde kalori artir.');
      } else if (isUnder && netCalories >= 0) {
        bullets.push('Ideal kilonun altindasin ve kalori fazlan var. Bu tempo ideal kiloya yaklastirir.');
      } else {
        bullets.push('Ideal kilo araligindasin. Kalorini dengede tutman yeterli.');
      }
      bullets.push(`Ideal aralik: ${minWeight} - ${maxWeight} kg.`);
    }

    if (todayStats.waterTarget && todayStats.waterLiters < todayStats.waterTarget) {
      const diff = Number((todayStats.waterTarget - todayStats.waterLiters).toFixed(1));
      bullets.push(`Su hedefinden ${diff} L eksiksin. Bugun bunu tamamla.`);
    }

    bullets.push(`Nabiz + adim analizine gore: ${todayPlan.title}. ${todayPlan.subtitle}`);
    return bullets;
  };

  const adviceBullets = buildAdviceBullets();

  const movingMinutes = todayStats.workoutMinutes || 0;
  const movingTarget = todayStats.workoutTarget || 30;
  const stepsProgress = todayStats.stepsTarget ? Math.min(1, displaySteps / todayStats.stepsTarget) : 0;
  const caloriesProgress = todayStats.caloriesTarget
    ? Math.min(1, (todayStats.calories || 0) / todayStats.caloriesTarget)
    : 0;
  const movingProgress = movingTarget ? Math.min(1, movingMinutes / movingTarget) : 0;
  const handleSaveSleep = async () => {
    const normalized = String(sleepHours || '').trim();
    const hoursNum = Number(normalized.replace(',', '.'));
    if (!Number.isFinite(hoursNum) || hoursNum < 0) {
      setSleepStatus('Saat bilgisi sayi olmali.');
      return;
    }
    try {
      await AsyncStorage.setItem(sleepStorageKey, String(hoursNum));
      setSleepHours(String(hoursNum));
      if (sessionUserId) {
        await saveSleepEntry({
          userId: sessionUserId,
          date: todayId,
          hours: hoursNum,
          source: dataSource === 'synced' ? 'device' : 'manual',
        });
      }
      try {
        const historyRaw = await AsyncStorage.getItem(SLEEP_HISTORY_KEY);
        const history = historyRaw ? JSON.parse(historyRaw) : [];
        const entry = {
          date: todayId,
          hours: hoursNum,
          source: dataSource === 'synced' ? 'device' : 'manual',
          createdAt: Date.now(),
        };
        const nextHistory = Array.isArray(history) ? [entry, ...history].slice(0, 90) : [entry];
        await AsyncStorage.setItem(SLEEP_HISTORY_KEY, JSON.stringify(nextHistory));
      } catch {
        // ignore history save errors
      }
      setSleepStatus('Uyku kaydedildi.');
    } catch {
      setSleepStatus('Uyku kaydedilemedi.');
    }
  };

  useEffect(() => {
    const loadSession = async () => {
      try {
        const stored = await AsyncStorage.getItem(SESSION_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.userId) setSessionUserId(parsed.userId);
        }
      } catch {
        // ignore
      }
    };
    loadSession();
  }, []);

  useEffect(() => {
    const loadTrainers = async () => {
      try {
        const stored = await AsyncStorage.getItem(TRAINERS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length) {
            setTrainerPreview(parsed.slice(0, 5));
            return;
          }
        }
        setTrainerPreview(fallbackTrainers);
      } catch {
        setTrainerPreview(fallbackTrainers);
      }
    };
    loadTrainers();
  }, []);


  useEffect(() => {
    setTodayStats((prev) => ({ ...prev, waterTarget }));
  }, [waterTarget]);

  const refreshCalories = async () => {
    try {
      const storedCalories = await AsyncStorage.getItem(`fitadvisor:calories:${todayId}`);
      if (storedCalories) {
        const parsedCalories = JSON.parse(storedCalories);
        if (Array.isArray(parsedCalories)) {
          const total = parsedCalories.reduce((sum, item) => sum + (Number(item?.calories) || 0), 0);
          setTodayStats((prev) => ({ ...prev, calories: Math.round(total) }));
        }
      }
    } catch {
      // ignore
    }
  };

  useFocusEffect(
    useCallback(() => {
      refreshCalories();
      return undefined;
    }, [todayId])
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedWater = await AsyncStorage.getItem(waterStorageKey);
        const storedWaterLiters = storedWater ? Number(storedWater) : null;

        const storedToday = await AsyncStorage.getItem(STORAGE_TODAY_KEY);
        if (storedToday) {
          const parsed = JSON.parse(storedToday);
          if (parsed.date === todayId && parsed.stats) {
            setTodayStats((prev) => ({
              ...prev,
              ...parsed.stats,
              waterLiters:
                Number.isFinite(storedWaterLiters) && storedWaterLiters !== null
                  ? storedWaterLiters
                  : parsed.stats.waterLiters ?? prev.waterLiters,
              calories: parsed.stats.calories ?? prev.calories ?? 0,
              caloriesTarget: parsed.stats.caloriesTarget ?? prev.caloriesTarget ?? 2000,
              waterTarget,
            }));
          }
        } else if (Number.isFinite(storedWaterLiters) && storedWaterLiters !== null) {
          setTodayStats((prev) => ({
            ...prev,
            waterLiters: storedWaterLiters,
            waterTarget,
          }));
        }

        const storedSource = await AsyncStorage.getItem(STORAGE_DATA_SOURCE_KEY);
        if (storedSource) {
          setDataSource(storedSource);
        }

        const storedCalories = await AsyncStorage.getItem(`fitadvisor:calories:${todayId}`);
        if (storedCalories) {
          const parsedCalories = JSON.parse(storedCalories);
          if (Array.isArray(parsedCalories)) {
            const total = parsedCalories.reduce((sum, item) => sum + (Number(item?.calories) || 0), 0);
            setTodayStats((prev) => ({ ...prev, calories: Math.round(total) }));
          }
        }

        let sleepApplied = false;
        const storedSleep = await AsyncStorage.getItem(sleepStorageKey);
        if (storedSleep !== null && storedSleep !== undefined) {
          setSleepHours(String(storedSleep));
          sleepApplied = true;
        }
        if (!sleepApplied && sessionUserId) {
          try {
            const sleepRes = await getSleepEntryForDate(sessionUserId, todayId);
            if (sleepRes.ok) {
              setSleepHours(String(sleepRes.hours ?? ''));
              sleepApplied = true;
            }
          } catch {
            // ignore remote load errors
          }
        }
        if (!sleepApplied) {
          setSleepHours('');
        }

        const storedWatch = await AsyncStorage.getItem(WATCH_SNAPSHOT_KEY);
        let watchApplied = false;
        if (storedWatch) {
          const parsedWatch = JSON.parse(storedWatch);
          const watchSteps = Number(parsedWatch?.steps || 0);
          const watchAvg = Number(parsedWatch?.avgHr || 0);
          if (Number.isFinite(watchSteps) && watchSteps > 0) {
            setTodayStats((prev) => ({ ...prev, steps: watchSteps }));
            setDataSource('synced');
            watchApplied = true;
          }
          if (Number.isFinite(watchAvg) && watchAvg > 0) {
            setWatchAvgHr(watchAvg);
          }
        }
        if (!watchApplied) {
          setTodayStats((prev) => ({ ...prev, steps: 0 }));
          setDataSource('manual');
        }
      } catch {
        // ignore
      } finally {
        setIsHydrated(true);
        setIsSleepHydrated(true);
      }
    };

    loadData();
  }, [todayId, waterStorageKey, waterTarget, sessionUserId, sleepStorageKey]);

  useEffect(() => {
    let active = true;
    const loadExercises = async () => {
      try {
        const stored = await AsyncStorage.getItem(exerciseStorageKey);
        if (!active) return;
        if (stored) {
          const parsed = JSON.parse(stored);
          setExerciseLog({
            pushups: parsed?.pushups ?? '',
            situps: parsed?.situps ?? '',
            ropeMinutes: parsed?.ropeMinutes ?? '',
            plankMinutes: parsed?.plankMinutes ?? '',
          });
        }
      } catch {
        // ignore
      } finally {
        if (active) setIsExerciseHydrated(true);
      }
    };
    loadExercises();
    return () => {
      active = false;
    };
  }, [exerciseStorageKey]);

  useEffect(() => {
    const persist = async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_TODAY_KEY,
          JSON.stringify({ date: todayId, stats: todayStats })
        );
        await AsyncStorage.setItem(STORAGE_DATA_SOURCE_KEY, dataSource);
        await AsyncStorage.setItem(waterStorageKey, String(todayStats.waterLiters ?? 0));
      } catch {
        // ignore
      }
    };

    if (isHydrated) {
      persist();
    }
  }, [todayStats, todayId, dataSource, waterStorageKey, isHydrated]);

  useEffect(() => {
    const persistExercises = async () => {
      try {
        await AsyncStorage.setItem(exerciseStorageKey, JSON.stringify(exerciseLog));
      } catch {
        // ignore
      }
    };
    if (isExerciseHydrated) {
      persistExercises();
    }
  }, [exerciseLog, exerciseStorageKey, isExerciseHydrated]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#0a1630', '#0c1d3c', '#0e2347']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
      <View style={styles.iconCloud}>
        {ICON_CLOUD.map((icon) => (
          <MaterialCommunityIcons
            key={icon.name}
            name={icon.name}
            size={icon.size}
            color={icon.color}
            style={[styles.iconCloudItem, { top: icon.top, left: icon.left, right: icon.right, bottom: icon.bottom }]}
          />
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Text style={styles.topTime}>{todayId}</Text>
          <MaterialCommunityIcons name="plus-circle-outline" size={22} color="#e2e8f0" />
        </View>

        <Image
          source={require('../../hero-arc.png')}
          style={[styles.heroArcImage, { width: heroArcWidth, height: heroArcHeight }]}
          resizeMode="contain"
        />
        <View style={styles.heroBadgeRow}>
          <TouchableOpacity
            style={styles.cookieBadge}
            onPress={() => router.push('/calories-burned')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="cookie" size={22} color="#fef3c7" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Gunluk ozet</Text>
            <Text style={styles.sectionLink}>Detaylar</Text>
          </View>

          <View style={styles.metricGrid}>
            <View style={styles.metricItem}>
              <View style={styles.metricIcon}>
                <MaterialCommunityIcons name="fire" size={16} color="#f97316" />
              </View>
              <View style={styles.metricText}>
                <Text style={styles.metricLabel}>Kalori</Text>
                <Text style={styles.metricValue}>{todayStats.calories || 0}</Text>
                <Text style={styles.metricTarget}>/ {todayStats.caloriesTarget} kcal</Text>
              </View>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${caloriesProgress * 100}%`, backgroundColor: '#f97316' }]} />
              </View>
            </View>
            <View style={styles.metricItem}>
              <View style={styles.metricIcon}>
                <MaterialCommunityIcons name="shoe-print" size={16} color="#fbbf24" />
              </View>
              <View style={styles.metricText}>
                <Text style={styles.metricLabel}>Adim</Text>
                <Text style={styles.metricValue}>{displaySteps}</Text>
                <Text style={styles.metricTarget}>/ {todayStats.stepsTarget} adim</Text>
              </View>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${stepsProgress * 100}%`, backgroundColor: '#fbbf24' }]} />
              </View>
            </View>
            <View style={styles.metricItem}>
              <View style={styles.metricIcon}>
                <MaterialCommunityIcons name="run" size={16} color="#38bdf8" />
              </View>
              <View style={styles.metricText}>
                <Text style={styles.metricLabel}>Hareket</Text>
                <Text style={styles.metricValue}>{movingMinutes}</Text>
                <Text style={styles.metricTarget}>/ {movingTarget} dk</Text>
              </View>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${movingProgress * 100}%`, backgroundColor: '#38bdf8' }]} />
              </View>
            </View>
          </View>

          <View style={styles.statusRow}>
            <View style={styles.statusPill}>
              <MaterialCommunityIcons name="human-handsup" size={16} color="#22c55e" />
              <Text style={styles.statusText}>Aktif sure: {movingMinutes} dk</Text>
            </View>
            <View style={styles.statusPill}>
              <MaterialCommunityIcons name="heart-pulse" size={16} color="#ef4444" />
              <Text style={styles.statusText}>
                Nabiz: {watchAvgHr ? `${watchAvgHr} bpm` : 'Veri bekleniyor'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardRow}>
          <View style={[styles.card, styles.smallCard]}>
            <TouchableOpacity style={styles.sectionHeaderRow} onPress={() => router.push('/sleep-history')}>
              <Text style={styles.sectionTitle}>Uyku</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#94a3b8" />
            </TouchableOpacity>
            <Text style={styles.subtitle}>Bugun kac saat uyudun?</Text>
            <TextInput
              value={sleepHours}
              onChangeText={(value) => {
                setSleepHours(value.replace(/[^0-9.,]/g, ''));
                setSleepStatus('');
              }}
              keyboardType="decimal-pad"
              placeholder="Orn. 7.5"
              placeholderTextColor="#94a3b8"
              style={[styles.exerciseInput, { marginTop: 8 }]}
            />
            <View style={[styles.actionsRow, { marginTop: 8 }]}>
              <TouchableOpacity style={styles.smallActionButton} onPress={handleSaveSleep}>
                <Text style={styles.smallActionText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
            {sleepStatus ? <Text style={[styles.statusText, { marginTop: 6 }]}>{sleepStatus}</Text> : null}
            {sleepHours ? (
              <Text style={[styles.meta, { marginTop: 6 }]}>Bugun kayitli: {sleepHours} saat</Text>
            ) : null}
          </View>
          <View style={[styles.card, styles.smallCard]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Nabiz</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#94a3b8" />
            </View>
            <Text style={styles.subtitle}>
              {watchAvgHr ? `Ortalama: ${watchAvgHr} bpm` : 'Nabiz verisi ekle'}
            </Text>
            <View style={styles.heartBarRow}>
              {Array.from({ length: 16 }).map((_, index) => (
                <View
                  key={`hb-${index}`}
                  style={[
                    styles.heartBar,
                    { height: 18 + (index % 4) * 4, opacity: watchAvgHr ? 1 : 0.45 },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Su</Text>
            <Text style={styles.sectionTag}>Hedef: {todayStats.waterTarget} L</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCardSmall}>
              <View style={styles.labelRow}>
                <MaterialCommunityIcons name="cup-water" size={52} color="#38bdf8" />
                <Text style={styles.statLabelLarge}>Su</Text>
              </View>
              <Text style={styles.statValue}>{todayStats.waterLiters} L</Text>
              <Text style={styles.statSubValue}>/ {todayStats.waterTarget} L</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.waterGlassRow}
              >
                {Array.from({ length: Math.round((todayStats.waterTarget || 0) / 0.25) }).map(
                  (_, index) => {
                    const filled = index < Math.round((todayStats.waterLiters || 0) / 0.25);
                    return (
                      <MaterialCommunityIcons
                        key={`glass-${index}`}
                        name="cup-water"
                        size={14}
                        color={filled ? '#22d3ee' : 'rgba(148,163,184,0.35)'}
                        style={styles.waterGlassIcon}
                      />
                    );
                  }
                )}
              </ScrollView>
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.smallActionButton}
                  onPress={() =>
                    setTodayStats((prev) => ({
                      ...prev,
                      waterLiters: Number(Math.max(0, prev.waterLiters - 0.25).toFixed(2)),
                    }))
                  }
                >
                  <Text style={styles.smallActionText}>-0.25 L</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.smallActionButton}
                  onPress={() =>
                    setTodayStats((prev) => ({
                      ...prev,
                      waterLiters: Number((prev.waterLiters + 0.25).toFixed(2)),
                    }))
                  }
                >
                  <Text style={styles.smallActionText}>+0.25 L</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Gunluk Kalori</Text>
          </View>
          <Text style={styles.subtitle}>Bugun yediklerin toplam kalori.</Text>
          <View style={styles.calorieRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.statLabel}>Toplam</Text>
              <Text style={styles.calorieTotal}>{todayStats.calories || 0} kcal</Text>
            </View>
          </View>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(
                    100,
                    todayStats.caloriesTarget ? ((todayStats.calories || 0) / todayStats.caloriesTarget) * 100 : 0
                  )}%`,
                  backgroundColor: '#f59e0b',
                },
              ]}
            />
          </View>

          <View style={styles.calorieBreakdown}>
            <View style={styles.calorieRow}>
              <Text style={styles.calorieLabel}>Bazal kalori</Text>
              <Text style={styles.calorieValue}>{basalCalories} kcal</Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(100, totalBurn ? (basalCalories / totalBurn) * 100 : 0)}%`,
                    backgroundColor: '#22c55e',
                  },
                ]}
              />
            </View>

            <View style={styles.calorieRow}>
              <Text style={styles.calorieLabel}>Egzersiz yakimi</Text>
              <Text style={styles.calorieValue}>{exerciseBurn} kcal</Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(100, totalBurn ? (exerciseBurn / totalBurn) * 100 : 0)}%`,
                    backgroundColor: '#38bdf8',
                  },
                ]}
              />
            </View>

            <Text style={styles.netCaloriesText}>
              {netCalories > 0
                ? `Kalori fazlasi: ${netCalories} kcal`
                : netCalories < 0
                  ? `Kalori acigi: ${Math.abs(netCalories)} kcal`
                  : 'Kalori dengede'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Basit egzersizler</Text>
          </View>
          <Text style={styles.subtitle}>
            Sayi veya dakika gir, yakilan kaloriyi gor.
          </Text>

          <View style={styles.exerciseRow}>
            <View style={styles.exerciseLabel}>
              <MaterialCommunityIcons name="arm-flex" size={20} color="#38bdf8" />
              <Text style={styles.exerciseText}>Sinav (adet)</Text>
            </View>
            <Text style={styles.exerciseKcal}>{calcCalories.pushups} kcal</Text>
          </View>
          <TextInput
            value={exerciseLog.pushups}
            onChangeText={(value) =>
              setExerciseLog((prev) => ({ ...prev, pushups: value.replace(/[^0-9]/g, '') }))
            }
            keyboardType="number-pad"
            placeholder="Orn. 30"
            placeholderTextColor="#94a3b8"
            style={styles.exerciseInput}
          />

          <View style={styles.exerciseRow}>
            <View style={styles.exerciseLabel}>
              <MaterialCommunityIcons name="human-handsup" size={20} color="#38bdf8" />
              <Text style={styles.exerciseText}>Mekik (adet)</Text>
            </View>
            <Text style={styles.exerciseKcal}>{calcCalories.situps} kcal</Text>
          </View>
          <TextInput
            value={exerciseLog.situps}
            onChangeText={(value) =>
              setExerciseLog((prev) => ({ ...prev, situps: value.replace(/[^0-9]/g, '') }))
            }
            keyboardType="number-pad"
            placeholder="Orn. 50"
            placeholderTextColor="#94a3b8"
            style={styles.exerciseInput}
          />

          <View style={styles.exerciseRow}>
            <View style={styles.exerciseLabel}>
              <MaterialCommunityIcons name="jump-rope" size={20} color="#38bdf8" />
              <Text style={styles.exerciseText}>Ip atlama (dk)</Text>
            </View>
            <Text style={styles.exerciseKcal}>{calcCalories.rope} kcal</Text>
          </View>
          <TextInput
            value={exerciseLog.ropeMinutes}
            onChangeText={(value) =>
              setExerciseLog((prev) => ({ ...prev, ropeMinutes: value.replace(/[^0-9]/g, '') }))
            }
            keyboardType="number-pad"
            placeholder="Orn. 5"
            placeholderTextColor="#94a3b8"
            style={styles.exerciseInput}
          />

          <View style={styles.exerciseRow}>
            <View style={styles.exerciseLabel}>
              <MaterialCommunityIcons name="human" size={20} color="#38bdf8" />
              <Text style={styles.exerciseText}>Plank (dk)</Text>
            </View>
            <Text style={styles.exerciseKcal}>{calcCalories.plank} kcal</Text>
          </View>
          <TextInput
            value={exerciseLog.plankMinutes}
            onChangeText={(value) =>
              setExerciseLog((prev) => ({ ...prev, plankMinutes: value.replace(/[^0-9]/g, '') }))
            }
            keyboardType="number-pad"
            placeholder="Orn. 3"
            placeholderTextColor="#94a3b8"
            style={styles.exerciseInput}
          />
        </View>

        {trainerPreview.length > 0 ? (
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Antrenorler</Text>
                <Text style={styles.sectionTag}>Onerilen</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.trainerRow}
              >
                {trainerTrack.map((t, idx) => (
                  <View
                    key={`${t.id || t.username || t.name || 'trainer'}-${idx}`}
                    style={styles.trainerChip}
                  >
                  {t.profilePhoto ? (
                    <Image source={{ uri: t.profilePhoto }} style={styles.trainerAvatar} />
                  ) : (
                    <View style={[styles.trainerAvatar, styles.avatarFallback]}>
                      <Text style={styles.avatarInitial}>
                        {(t.name || t.username || 'T')[0]?.toUpperCase?.() || 'T'}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.trainerName}>{t.name || t.username || 'Trainer'}</Text>
                  <Text style={styles.trainerMeta}>{t.specialty || 'Fitness'}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Bugunku onerim</Text>
            <Text style={styles.sectionTag}>Yogunluk: {todayPlan.intensity}</Text>
          </View>

          <Text style={styles.programTitle}>{todayPlan.title}</Text>
          <Text style={styles.programSubtitle}>{todayPlan.subtitle}</Text>

          <View style={styles.programList}>
            {todayPlan.items.map((item, index) => (
              <View key={`${item.title}-${index}`} style={styles.programItem}>
                <View style={styles.dot} />
                <View style={styles.programTextGroup}>
                  <Text style={styles.programItemTitle}>{item.title}</Text>
                  <Text style={styles.programItemMeta}>{item.meta}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.programList}>
            {adviceBullets.map((text, index) => (
              <View key={`advice-${index}`} style={styles.programItem}>
                <View style={styles.dot} />
                <View style={styles.programTextGroup}>
                  <Text style={styles.programItemTitle}>{text}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const horizontalPadding = width < 380 ? 16 : 24;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a1630',
    overflow: 'hidden',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  iconCloud: {
    ...StyleSheet.absoluteFillObject,
  },
  iconCloudItem: {
    position: 'absolute',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topTime: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
  },
  heroArc: {
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: heroArcHeight + 10,
  },
  heroArcImage: {
    alignSelf: 'center',
  },
  heroBadgeRow: {
    alignItems: 'flex-start',
    marginTop: -4,
  },
  cookieBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0c1a32',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
  },
  cookieText: {
    color: '#fef3c7',
    fontWeight: '700',
    fontSize: 12,
  },
  heroTitleRow: {
    marginTop: 0,
    marginBottom: 0,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
  },
  scrollContent: {
    paddingHorizontal: horizontalPadding,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 12,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(20,184,166,0.1)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 24,
  },
  logoWrap: {
    width: 104,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRing: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    borderColor: '#22d3ee',
  },
  logoRingThin: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.5)',
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.35,
    shadowRadius: 14,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#cbd5e1',
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTextGroup: {
    flex: 1,
    marginRight: 12,
    gap: 6,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  meta: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#0c1a32',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
  },
  chipText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
    backgroundColor: '#0c1a32',
    alignItems: 'center',
  },
  badgeLabel: {
    fontSize: 11,
    color: '#cbd5e1',
  },
  badgeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    marginBottom: 14,
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.3,
  },
  sectionLink: {
    fontSize: 12,
    color: '#38bdf8',
  },
  sectionTag: {
    fontSize: 12,
    color: '#94a3b8',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  statCardWide: {
    flex: 1,
    backgroundColor: '#0c1a32',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
  },
  statCardSmall: {
    flex: 1,
    backgroundColor: '#0c1a32',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
  },
  statLabel: {
    fontSize: 12,
    color: '#cbd5e1',
    marginBottom: 4,
  },
  metricGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricItem: {
    flex: 1,
    backgroundColor: '#0c1a32',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
  },
  metricIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  metricText: {
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 12,
    color: '#cbd5e1',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    lineHeight: 26,
  },
  metricTarget: {
    fontSize: 12,
    color: '#94a3b8',
  },
  statLabelLarge: {
    fontSize: 36,
    color: '#cbd5e1',
    fontWeight: '700',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
  },
  statSubValue: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#0c1a32',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
  },
  statusText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  waterGlassRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  waterGlassIcon: {
    marginRight: 2,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  smallCard: {
    flex: 1,
    padding: 16,
  },
  sleepBar: {
    marginTop: 10,
    height: 10,
    borderRadius: 12,
    backgroundColor: '#1f2937',
  },
  heartBarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 10,
  },
  heartBar: {
    width: 6,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  smallActionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
    backgroundColor: '#0ea5e91a',
  },
  smallActionText: {
    fontSize: 12,
    color: '#e2e8f0',
    fontWeight: '600',
  },
  calorieRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
    marginTop: 6,
  },
  calorieTotal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fef3c7',
  },
  calorieBreakdown: {
    marginTop: 14,
    gap: 10,
  },
  calorieLabel: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  calorieValue: {
    fontSize: 12,
    color: '#e2e8f0',
    fontWeight: '700',
  },
  netCaloriesText: {
    marginTop: 4,
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  progressBarBackground: {
    marginTop: 10,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#1f2937',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#10b981',
  },
  programTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 4,
  },
  programSubtitle: {
    fontSize: 13,
    color: '#cbd5e1',
    marginBottom: 12,
  },
  programList: {
    gap: 10,
  },
  programItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 10,
  },
  programTextGroup: {
    flex: 1,
  },
  programItemTitle: {
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: '700',
  },
  programItemMeta: {
    fontSize: 12,
    color: '#94a3b8',
  },
  footerSpace: {
    height: 24,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  exerciseLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseText: {
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: '600',
  },
  exerciseKcal: {
    fontSize: 13,
    color: '#fbbf24',
    fontWeight: '700',
  },
  exerciseInput: {
    backgroundColor: '#0c1a32',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
    color: '#f8fafc',
    fontSize: 14,
    marginTop: 8,
  },
  trainerRow: {
    gap: 14,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  trainerChip: {
    width: TRAINER_CARD_WIDTH,
    paddingVertical: 8,
    gap: 6,
    alignItems: 'center',
  },
  trainerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1f2937',
  },
  trainerName: {
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
  trainerMeta: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
  },
});

