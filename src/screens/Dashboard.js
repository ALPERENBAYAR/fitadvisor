import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { getUsdaApiKey } from '../utils/api';

const { width } = Dimensions.get('window');

const STORAGE_TODAY_KEY = 'fitadvisor:todayStats';
const STORAGE_HISTORY_KEY = 'fitadvisor:history';
const STORAGE_DATA_SOURCE_KEY = 'fitadvisor:dataSource';
const STORAGE_REMINDERS_KEY = 'fitadvisor:reminders';

function computeScore(stats) {
  if (!stats) return 0;
  const stepRatio = stats.stepsTarget ? stats.steps / stats.stepsTarget : 0;
  const workoutRatio = stats.workoutTarget ? stats.workoutMinutes / stats.workoutTarget : 0;
  const waterRatio = stats.waterTarget ? stats.waterLiters / stats.waterTarget : 0;
  const avg = (stepRatio + workoutRatio + waterRatio) / 3;
  const clamped = Math.max(0, Math.min(1, avg));
  return Math.round(clamped * 100);
}

function updateHistory(prevHistory, todayId, score) {
  const filtered = (prevHistory || []).filter((entry) => entry.date !== todayId);
  return [...filtered, { date: todayId, score }];
}

export default function Dashboard({ profile, goals, selectedProgram }) {
  const [imageUri, setImageUri] = useState(null);
  const [analysisText, setAnalysisText] = useState('┼Simdilik ├Ârnek bir analiz g├Âsteriliyor.');
  const [analysisStatus, setAnalysisStatus] = useState('idle'); // idle | loading | ready | error
  const userName = profile?.name || 'Alperen';

  const stepsTarget = goals?.stepsTarget ?? 8000;
  const workoutTarget = goals?.workoutMinutesTarget ?? 30;
  const waterTarget = goals?.waterTargetLiters ?? 2;
  const [todayStats, setTodayStats] = useState({
    steps: 3250,
    stepsTarget,
    workoutMinutes: 15,
    workoutTarget,
    waterLiters: 0.8,
    waterTarget,
    calories: 0,
    caloriesTarget: 2000,
  });
  const [history, setHistory] = useState([]);
  const [dataSource, setDataSource] = useState('manual'); // manual | synced
  const [reminders, setReminders] = useState({ water: true, steps: false, workout: true });
  const [foodEntries, setFoodEntries] = useState([]);
  const [foodQuery, setFoodQuery] = useState('');
  const [foodResults, setFoodResults] = useState([]);
  const [foodStatus, setFoodStatus] = useState('idle'); // idle | loading | error
  const [foodError, setFoodError] = useState('');

  const usdaApiKey = getUsdaApiKey();

  const todayId = new Date().toISOString().slice(0, 10);
  const score = computeScore(todayStats);

  const heightMeters = profile?.height ? Number(profile.height) / 100 : null;
  const weightKg = profile?.weight ? Number(profile.weight) : null;

  let bmi = null;
  if (heightMeters && weightKg && heightMeters > 0) {
    bmi = weightKg / (heightMeters * heightMeters);
  }

  let bmiLabel = '';
  let bmiComment = 'Profil bilgilerinle daha net bir analiz ├g─▒karaca─s─▒z.';

  if (bmi) {
    if (bmi < 18.5) {
      bmiLabel = 'Zay─▒f';
      bmiComment = 'Biraz kilo alman ve kas k├╝tleni art─▒rman faydal─▒ olabilir.';
    } else if (bmi < 25) {
      bmiLabel = 'Normal';
      bmiComment = 'Sa─sl─▒kl─▒ aral─▒ktas─▒n, hedefini korumaya odaklanabilirsin.';
    } else if (bmi < 30) {
      bmiLabel = 'Fazla kilolu';
      bmiComment = 'D├╝zenli ad─▒m ve antrenmanla ya─s oran─▒n─▒ d├╝┼s├╝rmeye odaklan.';
    } else {
      bmiLabel = 'Obezite';
      bmiComment = 'Daha kontroll├╝ bir program ve doktor deste─siyle ├gal─▒┼smak ├Ânemli.';
    }
  }

  const last7Days = history.slice(-7).map((entry) => {
    const date = new Date(entry.date);
    const label = date.toLocaleDateString('tr-TR', { weekday: 'short' });
    return { label, score: entry.score };
  });

  const incrementSteps = (delta) => {
    setTodayStats((prev) => ({
      ...prev,
      steps: Math.min(prev.steps + delta, prev.stepsTarget),
    }));
    setDataSource('manual');
  };

  const incrementWorkout = (delta) => {
    setTodayStats((prev) => ({
      ...prev,
      workoutMinutes: Math.min(prev.workoutMinutes + delta, prev.workoutTarget),
    }));
    setDataSource('manual');
  };

  const incrementWater = (delta) => {
    setTodayStats((prev) => ({
      ...prev,
      waterLiters: Math.min(prev.waterLiters + delta, prev.waterTarget),
    }));
    setDataSource('manual');
  };

  const addFoodEntry = (entry) => {
    const calories = Math.max(0, Math.round(entry.calories || 0));
    setFoodEntries((prev) => [...prev, { ...entry, calories }]);
    setTodayStats((prev) => ({ ...prev, calories: (prev.calories || 0) + calories }));
    setDataSource('manual');
  };

  const handleSearchFood = async () => {
    if (!foodQuery.trim()) {
      setFoodError('Bir besin ad─▒ yaz.');
      return;
    }
    if (!usdaApiKey) {
      setFoodError('USDA API anahtar─▒ bulunamad─▒. EXPO_PUBLIC_USDA_API_KEY tan─▒mlay─▒n.');
      return;
    }
    setFoodStatus('loading');
    setFoodError('');
    try {
      const res = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(foodQuery.trim())}&pageSize=5&api_key=${usdaApiKey}`
      );
      if (!res.ok) {
        setFoodError('USDA iste─si ba┼sar─▒s─▒z.');
        setFoodStatus('error');
        return;
      }
      const data = await res.json();
      const foods = Array.isArray(data?.foods) ? data.foods : [];
      const mapped = foods.map((f) => {
        const nutrient =
          (f.foodNutrients || []).find(
            (n) =>
              typeof n?.nutrientName === 'string' &&
              n.nutrientName.toLowerCase().includes('energy') &&
              (n.unitName || '').toLowerCase() === 'kcal'
          ) || {};
        return {
          id: f.fdcId || f.description,
          description: f.description || 'Bilinmeyen',
          brand: f.brandOwner || f.brandName || '',
          calories: nutrient.value || 0,
        };
      });
      setFoodResults(mapped);
      setFoodStatus('idle');
    } catch (e) {
      setFoodError('Arama s─▒ras─▒nda hata olu┼stu.');
      setFoodStatus('error');
    }
  };

  const handleCaloriesChange = (value) => {
    const numeric = Number(value.replace(/[^0-9.]/g, ''));
    if (Number.isNaN(numeric)) return;
    setTodayStats((prev) => ({ ...prev, calories: numeric }));
    setDataSource('manual');
  };

  const handleRunAnalysis = async () => {
    if (!bmi) {
      setAnalysisStatus('error');
      setAnalysisText('Analiz i├gin profil bilgilerini (boy ve kilo) eksiksiz doldurman yeterli.');
      return;
    }

    setAnalysisStatus('loading');

    // Backend analyze kapal─▒; lokal analiz metni kullan─▒l─▒yor.

    const goal = profile?.goalType;
    let text = '';

    if (goal === 'gain_muscle') {
      if (bmi < 22) {
        text =
          'Kas kazanmak i├gin nispeten zay─▒f say─▒labilecek bir aral─▒ktas─▒n. D├╝zenli kuvvet antrenman─▒ ve dengeli beslenme kas k├╝tleni art─▒rmana yard─▒m edecek.';
      } else if (bmi < 27) {
        text =
          'Kas kazanmak i├gin uygun bir aral─▒ktas─▒n. A─s─▒rl─▒k antrenmanlar─▒n─▒ d├╝zenli tutman ve toparlanmaya dikkat etmen yeterli.';
      } else {
        text =
          'Kas kazanma hedefin var; ├Ânce hafif bir ya─s azaltma d├Ânemi ile eklemlere y├╝k├╝ azaltmak daha konforlu olabilir.';
      }
    } else if (goal === 'maintain') {
      if (bmi < 18.5) {
        text =
          'Formu koruma hedefi i├gin kilon alt s─▒n─▒rda. Biraz daha g├╝├gl├╝ kas k├╝tlesi ve yeterli kalori almak seni daha dengeli hissettirebilir.';
      } else if (bmi < 25) {
        text =
          'Formunu koruma a├g─▒s─▒ndan iyi bir aral─▒ktas─▒n. D├╝zenli ad─▒m, hafif kuvvet ve esneme ├gal─▒┼smalar─▒ bu durumu s├╝rd├╝rmeni sa─slar.';
      } else {
        text =
          'Formu koruma hedefinde v├╝cut kompozisyonunu biraz hafifletmek konforunu art─▒rabilir; sakin tempolu kilo verme uygun g├Âr├╝n├╝yor.';
      }
    } else {
      if (bmi < 25) {
        text =
          'Kilo verme hedefin var ama BMI aral─▒─s─▒n fena de─sil. V├╝cudu s─▒k─▒la┼st─▒rmaya, kas korumaya ve sa─sl─▒kl─▒ beslenmeye odaklanmak yeterli olabilir.';
      } else if (bmi < 30) {
        text =
          'Kilo verme hedefin i├gin y├╝r├╝y├╝┼s, hafif ko┼su ve kuvvet egzersizlerini birle┼stirmek ya─s oran─▒n─▒ istikrarl─▒ ┼sekilde azaltmana yard─▒mc─▒ olur.';
      } else {
        text =
          'Kilo verme s├╝recinde yava┼s ve s├╝rd├╝r├╝lebilir ilerlemek en sa─sl─▒kl─▒s─▒. D├╝zenli hareket, uyku ve beslenme ile ba┼slay─▒p gerekirse uzman deste─si ekleyebilirsin.';
      }
    }

    if (selectedProgram?.title) {
      text += ` Se├gili program─▒n (${selectedProgram.title}) bu hedefe destek olacak ┼sekilde yap─▒land─▒r─▒ld─▒.`;
    }

    setAnalysisText(text);
    setAnalysisStatus('ready');
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedToday = await AsyncStorage.getItem(STORAGE_TODAY_KEY);
        if (storedToday) {
          const parsed = JSON.parse(storedToday);
          if (parsed.date === todayId && parsed.stats) {
            setTodayStats((prev) => ({
              ...prev,
              ...parsed.stats,
              calories: parsed.stats.calories ?? prev.calories ?? 0,
              caloriesTarget: parsed.stats.caloriesTarget ?? prev.caloriesTarget ?? 2000,
            }));
            if (Array.isArray(parsed.foodEntries)) {
              setFoodEntries(parsed.foodEntries);
            }
          }
        }

        const storedHistory = await AsyncStorage.getItem(STORAGE_HISTORY_KEY);
        if (storedHistory) {
          const parsedHistory = JSON.parse(storedHistory);
          if (Array.isArray(parsedHistory)) {
            setHistory(parsedHistory);
          }
        }

        const storedSource = await AsyncStorage.getItem(STORAGE_DATA_SOURCE_KEY);
        if (storedSource) {
          setDataSource(storedSource);
        }

        const storedReminders = await AsyncStorage.getItem(STORAGE_REMINDERS_KEY);
        if (storedReminders) {
          const parsed = JSON.parse(storedReminders);
          if (parsed) {
            setReminders(parsed);
          }
        }
      } catch (e) {
        // Ignore load errors; fall back to defaults
      }
    };

    loadData();
  }, [todayId]);

  useEffect(() => {
    const persist = async () => {
      try {
        const currentScore = computeScore(todayStats);
        await AsyncStorage.setItem(
          STORAGE_TODAY_KEY,
          JSON.stringify({ date: todayId, stats: todayStats, foodEntries })
        );

        setHistory((prev) => {
          const updated = updateHistory(prev, todayId, currentScore);
          AsyncStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(updated));
          return updated;
        });

        await AsyncStorage.setItem(STORAGE_DATA_SOURCE_KEY, dataSource);
      } catch (e) {
        // Non-blocking persistence
      }
    };

    persist();
  }, [todayStats, todayId, dataSource]);

  useEffect(() => {
    const persistReminders = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_REMINDERS_KEY, JSON.stringify(reminders));
      } catch (e) {
        // Non-blocking
      }
    };

    persistReminders();
  }, [reminders]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const toggleReminder = (key) => {
    setReminders((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const markAsSynced = () => setDataSource('synced');

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#0b1630','#0c1f40','#0e264d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroOverlay} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.greeting}>Merhaba, {userName}</Text>
            <Text style={styles.subtitle}>Bug├╝nk├╝ sa─sl─▒k ├Âzetin haz─▒r.</Text>
            <View style={styles.chipRow}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  Veri kayna─s─▒: {dataSource === 'synced' ? 'Senkron' : 'Manuel'}
                </Text>
              </View>
              {selectedProgram ? (
                <View style={[styles.chip, styles.chipAlt]}>
                  <Text style={styles.chipText}>Program: {selectedProgram.title}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeLabel}>G├╝n</Text>
            <Text style={styles.badgeValue}>3</Text>
          </View>
        </View>

        <View style={styles.scoreCard}>
          <View style={styles.scoreRing}>
            <Text style={styles.scoreValue}>{score}</Text>
            <Text style={styles.scoreUnit}>/100</Text>
          </View>
          <View style={styles.scoreTextContainer}>
            <Text style={styles.scoreTitle}>G├╝nl├╝k sa─sl─▒k skoru</Text>
            <Text style={styles.scoreDescription}>
              Ad─▒m, su ve antrenman hedeflerin tek yerde topland─▒. Devam edersen bug├╝n hedefi
              yakalayabilirsin.
            </Text>
            <View style={styles.dataSourceRow}>
              <Text style={styles.dataSourceValue}>
                {dataSource === 'synced' ? 'Senkron verisi' : 'Manuel giri┼s'}
              </Text>
              {dataSource !== 'synced' && (
                <TouchableOpacity style={styles.dataSourceButton} onPress={markAsSynced}>
                  <Text style={styles.dataSourceButtonText}>Senkron i┼saretle</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>G├Ârsel analiz</Text>
            {bmi && <Text style={styles.sectionTag}>BMI: {bmi.toFixed(1)} {bmiLabel ? `(${bmiLabel})` : ''}</Text>}
          </View>
          <View style={styles.profileRow}>
            <Image
              source={{ uri: imageUri ?? 'https://via.placeholder.com/120x120.png?text=You' }}
              style={styles.profileImage}
            />
            <View style={styles.profileTextContainer}>
              <Text style={styles.profileSubtitle}>
                Foto─sraf─▒na g├Âre duru┼s ve kompozisyonu ├Âzetliyoruz. {analysisText}
              </Text>
              <Text style={styles.bmiComment}>{bmiComment}</Text>
              <View style={styles.profileActions}>
                <TouchableOpacity style={styles.profileButton} onPress={handlePickImage}>
                  <Text style={styles.profileButtonText}>Foto─sraf Se├g</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.profileButton,
                    styles.profileAnalyzeButton,
                    analysisStatus === 'loading' && styles.profileButtonDisabled,
                  ]}
                  onPress={handleRunAnalysis}
                  disabled={analysisStatus === 'loading'}
                >
                  <Text style={styles.profileButtonText}>
                    {analysisStatus === 'loading' ? 'Analiz yap─▒l─▒yor...' : 'Analiz et'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Bug├╝nk├╝ hedeflerin</Text>
            <Text style={styles.sectionLink}>Detaylar</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCardWide}>
              <Text style={styles.statLabel}>Ad─▒m</Text>
              <Text style={styles.statValue}>{todayStats.steps}</Text>
              <Text style={styles.statSubValue}>/ {todayStats.stepsTarget} ad─▒m</Text>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${(todayStats.steps / todayStats.stepsTarget) * 100}%` },
                  ]}
                />
              </View>
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.smallActionButton} onPress={() => incrementSteps(500)}>
                  <Text style={styles.smallActionText}>+500</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallActionButton} onPress={() => incrementSteps(1000)}>
                  <Text style={styles.smallActionText}>+1000</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCardSmall}>
              <Text style={styles.statLabel}>Antrenman</Text>
              <Text style={styles.statValue}>{todayStats.workoutMinutes} dk</Text>
              <Text style={styles.statSubValue}>/ {todayStats.workoutTarget} dk</Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.smallActionButton} onPress={() => incrementWorkout(5)}>
                  <Text style={styles.smallActionText}>+5 dk</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.statCardSmall}>
              <Text style={styles.statLabel}>Su</Text>
              <Text style={styles.statValue}>{todayStats.waterLiters} L</Text>
              <Text style={styles.statSubValue}>/ {todayStats.waterTarget} L</Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.smallActionButton} onPress={() => incrementWater(0.25)}>
                  <Text style={styles.smallActionText}>+0.25 L</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>G├╝nl├╝k Kalori</Text>
            <Text style={styles.sectionTag}>Hedef: {todayStats.caloriesTarget} kcal</Text>
          </View>
          <Text style={styles.subtitle}>Bug├╝n ald─▒─s─▒n toplam kaloriyi yaz.</Text>
          <View style={styles.calorieRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.statLabel}>Al─▒nan</Text>
              <TextInput
                value={todayStats.calories ? String(todayStats.calories) : ''}
                onChangeText={handleCaloriesChange}
                placeholder="├Âr. 1850"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                style={styles.calorieInput}
              />
            </View>
            <View style={styles.calorieSummary}>
              <Text style={styles.statLabel}>Toplam</Text>
              <Text style={styles.calorieTotal}>{todayStats.calories || 0} kcal</Text>
              <Text style={styles.statSubValue}>/ {todayStats.caloriesTarget} kcal</Text>
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
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>USDA ile Kalori Ara</Text>
            {usdaApiKey ? <Text style={styles.sectionTag}>API haz─▒r</Text> : <Text style={styles.sectionTag}>API anahtar─▒ eksik</Text>}
          </View>
          <Text style={styles.subtitle}>Besin arat, USDA FoodData Central'dan kaloriyi ekle.</Text>
          <View style={styles.foodSearchRow}>
            <TextInput
              value={foodQuery}
              onChangeText={setFoodQuery}
              placeholder="├Âr. chicken breast"
              placeholderTextColor="#9ca3af"
              style={[styles.input, { flex: 1 }]}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.searchButton, foodStatus === 'loading' && styles.searchButtonDisabled]}
              onPress={handleSearchFood}
              disabled={foodStatus === 'loading'}
            >
              <Text style={styles.searchButtonText}>{foodStatus === 'loading' ? 'Aran─▒yor...' : 'Ara'}</Text>
            </TouchableOpacity>
          </View>
          {foodError ? <Text style={styles.message}>{foodError}</Text> : null}
          {foodResults.length > 0 ? (
            <View style={styles.foodResults}>
              {foodResults.map((item) => (
                <View key={item.id} style={styles.foodRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.foodTitle}>{item.description}</Text>
                    <Text style={styles.foodMeta}>
                      {item.brand ? `${item.brand} ÔCó ` : ''}{Math.round(item.calories || 0)} kcal
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.foodAddButton} onPress={() => addFoodEntry(item)}>
                    <Text style={styles.foodAddButtonText}>Ekle</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {foodEntries.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>G├╝n├╝n Kalori Kayd─▒</Text>
              <Text style={styles.sectionTag}>{foodEntries.length} ├Â─se</Text>
            </View>
            <View style={styles.foodResults}>
              {foodEntries.map((item, index) => (
                <View key={`${item.id || index}-${index}`} style={styles.foodRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.foodTitle}>{item.description || 'Bilinmeyen'}</Text>
                    <Text style={styles.foodMeta}>{Math.round(item.calories || 0)} kcal</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Hat─▒rlatmalar</Text>
            <Text style={styles.sectionTag}>Su / Ad─▒m / Antrenman</Text>
          </View>
          {['water', 'steps', 'workout'].map((key) => (
            <View
              key={key}
              style={[
                styles.reminderRow,
                reminders[key] && styles.reminderRowActive,
              ]}
            >
              <Text style={styles.reminderLabel}>
                {key === 'water' && 'Su bildirimi'}
                {key === 'steps' && 'Ad─▒m bildirimi'}
                {key === 'workout' && 'Antrenman bildirimi'}
              </Text>
              <Switch
                value={reminders[key]}
                onValueChange={() => toggleReminder(key)}
                trackColor={{ true: '#16a34a', false: '#1f2937' }}
                thumbColor={reminders[key] ? '#dcfce7' : '#e2e8f0'}
              />
            </View>
          ))}
          <Text style={styles.reminderHint}>
            Bildirimler yerel olarak planlanacak. Expo Notifications ekleyerek ger├gek hat─▒rlatmalara ge├gebilirsin.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Son 7 g├╝n</Text>
            <Text style={styles.sectionTag}>G├╝nl├╝k skor</Text>
          </View>
          <View style={styles.historyList}>
            {last7Days.map((day) => (
              <View key={day.label} style={styles.historyRow}>
                <Text style={styles.historyDay}>{day.label}</Text>
                <View style={styles.historyBarBackground}>
                  <View style={[styles.historyBarFill, { width: `${day.score}%` }]} />
                </View>
                <Text style={styles.historyValue}>{day.score}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Bug├╝nk├╝ ├Ânerin</Text>
            <Text style={styles.sectionTag}>Full body ÔCó 35 dk</Text>
          </View>

          <Text style={styles.programTitle}>FitAdvisor G├╝n 3</Text>
          <Text style={styles.programSubtitle}>
            Is─▒nma, temel kuvvet ve hafif kardiyo ile dengeli bir seans.
          </Text>

          <View style={styles.programList}>
            <View style={styles.programItem}>
              <View style={styles.dot} />
              <View style={styles.programTextGroup}>
                <Text style={styles.programItemTitle}>5 dk hafif y├╝r├╝y├╝┼s</Text>
                <Text style={styles.programItemMeta}>Is─▒nma ÔCó d├╝┼s├╝k tempo</Text>
              </View>
            </View>

            <View style={styles.programItem}>
              <View style={styles.dot} />
              <View style={styles.programTextGroup}>
                <Text style={styles.programItemTitle}>Squat + Push-up</Text>
                <Text style={styles.programItemMeta}>3 set ÔCó 12 tekrar</Text>
              </View>
            </View>

            <View style={styles.programItem}>
              <View style={styles.dot} />
              <View style={styles.programTextGroup}>
                <Text style={styles.programItemTitle}>Plank</Text>
                <Text style={styles.programItemMeta}>3 set ÔCó 30 sn</Text>
              </View>
            </View>
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
    backgroundColor: '#0a1428',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: -80,
    right: -80,
    height: 230,
    borderBottomLeftRadius: 48,
    borderBottomRightRadius: 48,
    opacity: 0.98,
  },
  scrollContent: {
    paddingHorizontal: horizontalPadding,
    paddingTop: 18,
    paddingBottom: 24,
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
  chipAlt: {
    backgroundColor: '#0ea5e9',
    borderColor: '#38bdf8',
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
  scoreCard: {
    flexDirection: 'row',
    backgroundColor: '#0c1a32',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
  },
  scoreRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 8,
    borderColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: '#0c1a32',
  },
  scoreValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ecfeff',
  },
  scoreUnit: {
    fontSize: 11,
    color: '#94a3b8',
  },
  scoreTextContainer: {
    flex: 1,
    gap: 6,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  scoreDescription: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 19,
  },
  dataSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  dataSourceValue: {
    fontSize: 12,
    color: '#f8fafc',
    fontWeight: '600',
  },
  dataSourceButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dataSourceButtonText: {
    fontSize: 12,
    color: '#0b1120',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#0c1a32',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#020617',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  sectionLink: {
    fontSize: 12,
    color: '#38bdf8',
  },
  sectionTag: {
    fontSize: 12,
    color: '#94a3b8',
  },
  profileRow: {
    flexDirection: 'row',
    gap: 12,
  },
  profileImage: {
    width: 92,
    height: 92,
    borderRadius: 18,
    backgroundColor: '#1f2937',
  },
  profileTextContainer: {
    flex: 1,
    gap: 6,
  },
  profileSubtitle: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  bmiComment: {
    fontSize: 12,
    color: '#94a3b8',
  },
  profileActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  profileButton: {
    backgroundColor: '#0c1a32',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
  },
  profileAnalyzeButton: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  profileButtonDisabled: {
    opacity: 0.6,
  },
  profileButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
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
  calorieRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
    marginTop: 8,
  },
  calorieInput: {
    backgroundColor: '#0c1a32',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
    color: '#f8fafc',
    fontSize: 16,
  },
  calorieSummary: {
    minWidth: 120,
    backgroundColor: '#0c1a32',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
    alignItems: 'flex-start',
  },
  calorieTotal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fef3c7',
  },
  foodSearchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  searchButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#0ea5e9',
    borderRadius: 10,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: '#0b1120',
    fontWeight: '800',
    fontSize: 13,
  },
  foodResults: {
    marginTop: 8,
    gap: 10,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0c1a32',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
  },
  foodTitle: {
    color: '#e2e8f0',
    fontWeight: '700',
  },
  foodMeta: {
    color: '#94a3b8',
    fontSize: 12,
  },
  foodAddButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#10b981',
    borderRadius: 10,
  },
  foodAddButtonText: {
    color: '#0b1120',
    fontWeight: '800',
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
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
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#0c1a32',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
    marginBottom: 8,
  },
  reminderRowActive: {
    borderColor: '#10b981',
  },
  reminderLabel: {
    fontSize: 14,
    color: '#e2e8f0',
  },
  reminderHint: {
    marginTop: 6,
    fontSize: 12,
    color: '#94a3b8',
  },
  historyList: {
    gap: 8,
    marginTop: 6,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyDay: {
    width: 48,
    fontSize: 12,
    color: '#cbd5e1',
  },
  historyBarBackground: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#1f2937',
    overflow: 'hidden',
  },
  historyBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#38bdf8',
  },
  historyValue: {
    width: 36,
    fontSize: 12,
    textAlign: 'right',
    color: '#cbd5e1',
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
});









