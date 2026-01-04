import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { getUsdaApiKey } from '../utils/api';
import { saveDailyCalories } from '../firebase/service';

type FoodItem = {
  id: string;
  description: string;
  brand?: string;
  calories: number;
  grams?: number;
};

const ICON_CLOUD = [
  { name: 'food-apple', size: 150, color: 'rgba(239,68,68,0.22)', top: -40, left: 40 },
  { name: 'food-drumstick', size: 150, color: 'rgba(245,158,11,0.24)', top: -20, right: 60 },
  { name: 'hamburger', size: 150, color: 'rgba(248,113,113,0.24)', top: 70, left: 120 },
  { name: 'food-steak', size: 160, color: 'rgba(251,146,60,0.22)', top: 110, right: 140 },
  { name: 'food-hot-dog', size: 140, color: 'rgba(250,204,21,0.22)', top: 210, left: 40 },
  { name: 'food-variant', size: 170, color: 'rgba(167,139,250,0.2)', top: 240, right: 40 },
  { name: 'silverware-fork-knife', size: 130, color: 'rgba(56,189,248,0.22)', top: 320, left: 160 },
  { name: 'food', size: 150, color: 'rgba(125,211,252,0.2)', top: 360, right: 140 },
  { name: 'pizza', size: 160, color: 'rgba(251,191,36,0.22)', top: 440, left: 70 },
  { name: 'food-turkey', size: 150, color: 'rgba(248,113,113,0.2)', top: 520, right: 70 },
  { name: 'food-croissant', size: 160, color: 'rgba(34,197,94,0.22)', bottom: 220, left: 20 },
  { name: 'noodles', size: 150, color: 'rgba(74,222,128,0.22)', bottom: 200, right: 20 },
  { name: 'food-drumstick-bite', size: 150, color: 'rgba(190,242,100,0.22)', bottom: 120, left: 140 },
  { name: 'ice-cream', size: 150, color: 'rgba(248,250,252,0.18)', bottom: 120, right: 140 },
  { name: 'hamburger', size: 150, color: 'rgba(248,113,113,0.2)', bottom: 60, left: 60 },
  { name: 'pizza', size: 150, color: 'rgba(251,191,36,0.2)', bottom: 60, right: 60 },
  { name: 'food-apple', size: 140, color: 'rgba(239,68,68,0.2)', bottom: 10, left: 220 },
];

const TR_EN_MAP: Record<string, string> = {
  'tavuk göğsü': 'chicken breast',
  'tavuk gogus': 'chicken breast',
  tavuk: 'chicken',
  pirinç: 'rice',
  pirinc: 'rice',
  bulgur: 'bulgur',
  elma: 'apple',
  armut: 'pear',
  muz: 'banana',
  yumurta: 'egg',
  peynir: 'cheese',
  yoğurt: 'yogurt',
  yogurt: 'yogurt',
  'ton balığı': 'tuna',
  tonbaligi: 'tuna',
  somon: 'salmon',
  patates: 'potato',
  mercimek: 'lentils',
  fasulye: 'beans',
  nohut: 'chickpeas',
  yulaf: 'oats',
  ekmek: 'bread',
  et: 'meat',
  dana: 'beef',
  hindi: 'turkey',
};

const normalizeQuery = (q: string) =>
  q
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/\s+/g, ' ')
    .trim();

const translateQuery = (q: string) => {
  const lower = normalizeQuery(q);
  for (const [tr, en] of Object.entries(TR_EN_MAP)) {
    if (lower.includes(normalizeQuery(tr))) {
      return en;
    }
  }
  return q;
};

export default function CalorieSearch() {
  const usdaApiKey = getUsdaApiKey();
  const [foodQuery, setFoodQuery] = useState('');
  const [foodResults, setFoodResults] = useState<FoodItem[]>([]);
  const [foodEntries, setFoodEntries] = useState<FoodItem[]>([]);
  const [foodStatus, setFoodStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [foodError, setFoodError] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualGrams, setManualGrams] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [manualStatus, setManualStatus] = useState<'idle' | 'loading'>('idle');

  const todayId = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const totalCalories = foodEntries.reduce((sum, item) => sum + (item.calories || 0), 0);

  useEffect(() => {
    const loadSaved = async () => {
      try {
        const saved = await AsyncStorage.getItem(`fitadvisor:calories:${todayId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setFoodEntries(parsed);
          }
        }
      } catch {
        // ignore
      }
    };
    loadSaved();
  }, [todayId]);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const stored = await AsyncStorage.getItem('fitadvisor:session');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.userId) setUserId(parsed.userId);
        }
      } catch {
        // ignore
      }
    };
    loadSession();
  }, []);

  useEffect(() => {
    const persist = async () => {
      try {
        await AsyncStorage.setItem(`fitadvisor:calories:${todayId}`, JSON.stringify(foodEntries));
        if (userId) {
          await saveDailyCalories({
            userId,
            date: todayId,
            total: Math.round(totalCalories),
            entries: foodEntries,
          });
        }
      } catch {
        // ignore
      }
    };
    persist();
  }, [foodEntries, todayId, userId, totalCalories]);

  const getCalories = (food: any) => {
    const nutrient =
      (food.foodNutrients || []).find((n: any) => {
        const name = (n?.nutrientName || '').toLowerCase();
        const unit = (n?.unitName || '').toLowerCase();
        const number = String(n?.nutrientNumber || '');
        const isEnergy = name.includes('energy') || number === '208';
        return isEnergy && (unit.includes('kcal') || unit.includes('kj'));
      }) || {};

    let calories = Number(nutrient.value) || 0;
    if (calories === 0 && food?.labelNutrients?.calories?.value) {
      calories = Number(food.labelNutrients.calories.value) || 0;
    }
    if (calories === 0 && nutrient.unitName && nutrient.unitName.toLowerCase().includes('kj')) {
      calories = Math.round(Number(nutrient.value || 0) / 4.184);
    }
    return calories;
  };

  const handleSearchFood = async () => {
    if (!foodQuery.trim()) {
      setFoodError('Bir besin adı yazın.');
      return;
    }
    if (!usdaApiKey) {
      setFoodError('USDA API anahtarı bulunamadı. EXPO_PUBLIC_USDA_API_KEY tanımlayın.');
      return;
    }
    setFoodStatus('loading');
    setFoodError('');

    const raw = foodQuery.trim();
    const translated = translateQuery(raw);
    const normalized = normalizeQuery(raw);

    const searchOnce = async (q: string) => {
      const res = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(q)}&pageSize=10&api_key=${usdaApiKey}`
      );
      if (!res.ok) return null;
      const data = await res.json();
      const foods = Array.isArray(data?.foods) ? data.foods : [];
      return foods.map((f: any) => ({
        id: f.fdcId?.toString() || f.description,
        description: f.description || 'Bilinmeyen',
        brand: f.brandOwner || f.brandName || '',
        calories: getCalories(f),
      }));
    };

    try {
      let mapped = await searchOnce(raw);
      if ((!mapped || mapped.length === 0) && translated !== raw) {
        mapped = await searchOnce(translated);
      }
      if ((!mapped || mapped.length === 0) && normalized !== raw) {
        mapped = await searchOnce(normalized);
      }

      if (!mapped || mapped.length === 0) {
        setFoodError('Sonuç bulunamadı. İngilizce isim veya farklı yazım deneyin ya da Manuel ekle kullanın.');
        setFoodStatus('error');
        return;
      }

      setFoodResults(mapped);
      setFoodStatus('idle');
    } catch (e) {
      setFoodError('Arama sırasında hata oluştu.');
      setFoodStatus('error');
    }
  };

  const addFoodEntry = (item: FoodItem) => {
    setFoodEntries((prev) => [...prev, item]);
  };

  const handleAddManual = async () => {
    if (!manualName.trim()) return;
    const gramsVal = Number(manualGrams || '0');
    if (Number.isNaN(gramsVal) || gramsVal <= 0) {
      setFoodError('Gram bilgisini girin.');
      return;
    }

    // Eğer kalori girilmemişse USDA'dan otomatik çekmeyi dene
    if (usdaApiKey) {
      setManualStatus('loading');
      try {
        const translated = translateQuery(manualName.trim());
        const normalized = normalizeQuery(manualName.trim());
        const res = await fetch(
          `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(translated)}&pageSize=1&api_key=${usdaApiKey}`
        );
        const resFallback =
          !res.ok &&
          (await fetch(
            `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(normalized)}&pageSize=1&api_key=${usdaApiKey}`
          ));
        const finalRes = res.ok ? res : resFallback;

        if (finalRes && finalRes.ok) {
          const data = await finalRes.json();
          const first = Array.isArray(data?.foods) && data.foods.length > 0 ? data.foods[0] : null;
          if (first) {
            const per100 = getCalories(first);
            const scaled = gramsVal > 0 ? (per100 * gramsVal) / 100 : per100;
            const entry: FoodItem = {
              id: first.fdcId?.toString() || first.description || manualName,
              description: manualName.trim(),
              brand: first.brandOwner || first.brandName || '',
              calories: scaled,
              grams: gramsVal,
            };
            setFoodEntries((prev) => [...prev, entry]);
            setManualName('');
            setManualGrams('');
            setManualStatus('idle');
            return;
          }
        }
      } catch {
        // fall through to manual calorie entry
      }
      setManualStatus('idle');
    }

    setManualStatus('idle');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#0a1630', '#0c1d3c', '#0e2347']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
      <View style={styles.iconCloud}>
        {ICON_CLOUD.map((icon, index) => (
          <MaterialCommunityIcons
            key={`${icon.name}-${index}`}
            name={icon.name}
            size={icon.size}
            color={icon.color}
            style={[styles.iconCloudItem, { top: icon.top, left: icon.left, right: icon.right, bottom: icon.bottom }]}
          />
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Kalori Arama</Text>
        <Text style={styles.subtitle}>
          Besinleri Türkçe ya da İngilizce yazabilirsin; arka planda USDA FoodData Central sonuçlarını getiriyoruz.
        </Text>
        <Text style={styles.dateText}>Tarih: {todayId}</Text>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>USDA ile Kalori Ara</Text>
            {usdaApiKey ? <Text style={styles.sectionTag}>API hazır</Text> : <Text style={styles.sectionTag}>API anahtarı eksik</Text>}
          </View>
          <View style={styles.foodSearchRow}>
            <TextInput
              value={foodQuery}
              onChangeText={setFoodQuery}
              placeholder="örn. tavuk göğsü 200g"
              placeholderTextColor="#9ca3af"
              style={[styles.input, { flex: 1 }]}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.searchButton, foodStatus === 'loading' && styles.searchButtonDisabled]}
              onPress={handleSearchFood}
              disabled={foodStatus === 'loading'}
            >
              <Text style={styles.searchButtonText}>{foodStatus === 'loading' ? 'Aranıyor...' : 'Ara'}</Text>
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
                      {item.brand ? `${item.brand} • ` : ''}{Math.round(item.calories || 0)} kcal{item.grams ? ` (${item.grams} g)` : ''}
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

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Manuel Ekle</Text>
            <Text style={styles.sectionTag}>Bugün</Text>
          </View>
          <View style={styles.foodSearchRow}>
            <TextInput
              value={manualName}
              onChangeText={setManualName}
              placeholder="örn. peynirli tost"
              placeholderTextColor="#9ca3af"
              style={[styles.input, { flex: 1 }]}
            />
            <TextInput
              value={manualGrams}
              onChangeText={setManualGrams}
              placeholder="gram"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              style={[styles.input, { width: 90, textAlign: 'center' }]}
            />
            <TouchableOpacity
              style={[styles.foodAddButton, manualStatus === 'loading' && styles.searchButtonDisabled]}
              onPress={handleAddManual}
              disabled={manualStatus === 'loading'}
            >
              <Text style={styles.foodAddButtonText}>{manualStatus === 'loading' ? 'Ekleniyor...' : 'Ekle'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Bugün Yediklerin</Text>
            <Text style={styles.sectionTag}>Toplam: {Math.round(totalCalories)} kcal</Text>
          </View>
          {foodEntries.length === 0 ? (
            <Text style={styles.message}>Henüz eklenmiş öğe yok.</Text>
          ) : (
            <View style={styles.foodResults}>
              {foodEntries.map((item, index) => (
                <View key={`${item.id}-${index}`} style={styles.foodRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.foodTitle}>{item.description}</Text>
                    <Text style={styles.foodMeta}>
                      {Math.round(item.calories || 0)} kcal{item.grams ? ` (${item.grams} g)` : ''}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.foodRemoveButton} onPress={() => setFoodEntries((prev) => prev.filter((_, i) => i !== index))}>
                    <Text style={styles.foodRemoveText}>Sil</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0a1630' },
  gradient: { ...StyleSheet.absoluteFillObject },
  iconCloud: { ...StyleSheet.absoluteFillObject },
  iconCloudItem: { position: 'absolute' },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#f8fafc' },
  subtitle: { fontSize: 14, color: '#cbd5e1', lineHeight: 20 },
  dateText: { fontSize: 13, color: '#94a3b8', marginBottom: 6 },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: 10,
  },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#e2e8f0' },
  sectionTag: { fontSize: 12, color: '#94a3b8' },
  foodSearchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    color: '#f8fafc',
    fontSize: 15,
  },
  searchButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
  },
  searchButtonDisabled: { opacity: 0.6 },
  searchButtonText: { color: '#0b1120', fontWeight: '800', fontSize: 13 },
  message: { color: '#f87171', fontSize: 12 },
  foodResults: { gap: 10 },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  foodTitle: { color: '#e2e8f0', fontWeight: '700' },
  foodMeta: { color: '#94a3b8', fontSize: 12 },
  foodAddButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#10b981',
    borderRadius: 10,
  },
  foodAddButtonText: { color: '#0b1120', fontWeight: '800', fontSize: 12 },
  foodRemoveButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#ef4444',
    borderRadius: 10,
  },
  foodRemoveText: { color: '#0b1120', fontWeight: '800', fontSize: 12 },
});
