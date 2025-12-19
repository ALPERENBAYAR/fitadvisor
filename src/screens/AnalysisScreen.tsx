import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFormEntriesForUser, saveFormEntry } from '../firebase/service';

type FormEntry = {
  date: string;
  status: string;
  createdAt?: number;
  photoUri?: string | null;
  photoBase64?: string | null;
};

const { width } = Dimensions.get('window');
const horizontalPadding = width < 380 ? 16 : 24;
const N8N_WEBHOOK_URL = process.env.EXPO_PUBLIC_N8N_WEBHOOK_URL || '';
const STORAGE_FORM_LOG_KEY = 'fitadvisor:formLog';
const FORM_TYPE_OPTIONS = ['Fit', 'Bulk', 'Cut'];

const uriToBase64 = async (uri: string) => {
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const comma = dataUrl.indexOf(',');
        resolve(comma > -1 ? dataUrl.slice(comma + 1) : dataUrl);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return base64;
  } catch (e) {
    return '';
  }
};

export default function AnalysisScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [formEntries, setFormEntries] = useState<FormEntry[]>([]);
  const [formType, setFormType] = useState(FORM_TYPE_OPTIONS[0]);
  const [formError, setFormError] = useState('');
  const [formPhotoUri, setFormPhotoUri] = useState<string | null>(null);
  const [formPhotoBase64, setFormPhotoBase64] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const todayId = new Date().toISOString().slice(0, 10);

  const withPhotoUri = (entry: FormEntry): FormEntry => {
    if (entry.photoUri) return entry;
    if (entry.photoBase64) {
      return { ...entry, photoUri: `data:image/jpeg;base64,${entry.photoBase64}` };
    }
    return entry;
  };

  const statusLabel = useMemo(() => {
    if (status === 'loading') return 'n8n çalışıyor...';
    if (status === 'success') return 'Analiz tamam';
    if (status === 'error') return 'Hata';
    return N8N_WEBHOOK_URL ? 'Hazır' : 'Webhook eksik';
  }, [status]);

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

  const pickImage = async () => {
    const { status: perm } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm !== 'granted') return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });
    if (!res.canceled && res.assets?.length) {
      const asset = res.assets[0];
      const base64 = asset.base64 || (asset.uri ? await uriToBase64(asset.uri) : '');
      setImageUri(asset.uri || null);
      setImageBase64(base64 || '');
    }
  };

  const pickFormPhoto = async () => {
    const { status: perm } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm !== 'granted') return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      base64: true,
    });
    if (!res.canceled && res.assets?.length) {
      const asset = res.assets[0];
      const base64 = asset.base64 || (asset.uri ? await uriToBase64(asset.uri) : '');
      setFormPhotoUri(asset.uri || null);
      setFormPhotoBase64(base64 || '');
    }
  };

  const runAnalysis = async () => {
    if (!N8N_WEBHOOK_URL) {
      setError('n8n webhook URL’i tanımlı değil (EXPO_PUBLIC_N8N_WEBHOOK_URL).');
      return;
    }
    setStatus('loading');
    setError('');
    setResult(null);

    try {
      const payload = {
        note: note.trim(),
        imageUri,
        imageBase64: imageBase64?.slice(0, 250000) || '',
      };
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setStatus('error');
        setError('n8n isteği başarısız.');
        return;
      }

      const data = await res.json();
      setResult(data);
      setStatus('success');
    } catch (e) {
      setStatus('error');
      setError('Analiz sırasında hata oluştu.');
    }
  };

  const addFormLog = () => {
    const cleanStatus = formType?.trim();
    if (!cleanStatus) {
      setFormError('Form bilgisini seç.');
      return;
    }
    setFormError('');
    const entry: FormEntry = {
      date: todayId,
      status: cleanStatus,
      createdAt: Date.now(),
      photoUri: formPhotoUri,
      photoBase64: formPhotoBase64 || null,
    };
    setFormEntries((prev) => [entry, ...prev].slice(0, 20).map(withPhotoUri));
    if (userId) {
      saveFormEntry({
        userId,
        date: todayId,
        status: cleanStatus,
        photoBase64: formPhotoBase64 || null,
      }).catch(() => {});
    }
    setFormPhotoUri(null);
    setFormPhotoBase64('');
  };

  useEffect(() => {
    const loadForm = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_FORM_LOG_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setFormEntries(parsed.map(withPhotoUri));
        }
      } catch {
        // ignore
      }
    };
    loadForm();
  }, []);

  useEffect(() => {
    const loadRemote = async () => {
      if (!userId) return;
      try {
        const remote = await getFormEntriesForUser(userId, 20);
        if (Array.isArray(remote) && remote.length > 0) {
          setFormEntries(remote.map(withPhotoUri));
        }
      } catch {
        // ignore remote load errors
      }
    };
    loadRemote();
  }, [userId]);

  useEffect(() => {
    const persist = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_FORM_LOG_KEY, JSON.stringify(formEntries));
      } catch {
        // ignore
      }
    };
    persist();
  }, [formEntries]);

  const parsedResult = useMemo(() => {
    if (!result) {
      return {
        summary:
          'Fotoğrafına göre duruş ve kompozisyonu özetliyoruz. Şimdilik örnek bir analiz gösteriliyor.',
        posture: 'Omuz hizası dengeli görünüyor, hafif boyun öne eğilme eğilimi olabilir.',
        advice: 'Günlük 2x5 dk duruş açma hareketleri ve hafif core çalışmaları ekle.',
      };
    }
    if (typeof result === 'string') {
      return { summary: result };
    }
    return {
      summary: result.summary || 'Analiz tamamlandı.',
      posture: result.posture,
      advice: result.advice,
      bmi: result.bmi,
      score: result.score,
    };
  }, [result]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#0b1630', '#0c1f40', '#0e264d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroOverlay}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Analiz</Text>
            <Text style={styles.subtitle}>Fotoğrafını n8n üzerinden Ollama’ya gönderip duruş analizi al.</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              status === 'error' && styles.statusBadgeError,
              status === 'loading' && styles.statusBadgeLoading,
            ]}
          >
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>Görsel analiz</Text>
            <Text style={styles.sectionTag}>{parsedResult.bmi ? `BMI: ${parsedResult.bmi}` : 'BMI: -'}</Text>
          </View>
          <View style={styles.row}>
            <Image
              source={{ uri: imageUri ?? 'https://via.placeholder.com/120x120.png?text=You' }}
              style={styles.preview}
            />
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.cardText}>{parsedResult.summary}</Text>
              {parsedResult.posture ? <Text style={styles.muted}>Duruş: {parsedResult.posture}</Text> : null}
              {parsedResult.advice ? <Text style={styles.muted}>Öneri: {parsedResult.advice}</Text> : null}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.profileButton} onPress={pickImage}>
                  <Text style={styles.profileButtonText}>Fotoğraf Seç</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.profileButton,
                    styles.profileAnalyzeButton,
                    status === 'loading' && styles.profileButtonDisabled,
                  ]}
                  onPress={runAnalysis}
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? (
                    <ActivityIndicator size="small" color="#0b1120" />
                  ) : (
                    <Text style={styles.profileButtonText}>Analiz et</Text>
                  )}
                </TouchableOpacity>
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>Form Kaydı</Text>
            <Text style={styles.sectionTag}>Bugün: {todayId}</Text>
          </View>
          <View style={styles.formRow}>
            <View style={styles.formDateBox}>
              <Text style={styles.formDateLabel}>Tarih</Text>
              <Text style={styles.formDateValue}>{todayId}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.formTypeRow}>
                {FORM_TYPE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.formTypeChip,
                      formType === option && styles.formTypeChipActive,
                    ]}
                    onPress={() => setFormType(option)}
                  >
                    <Text
                      style={[
                        styles.formTypeChipText,
                        formType === option && styles.formTypeChipTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.formActionsRow}>
                <TouchableOpacity style={styles.profileButton} onPress={pickFormPhoto}>
                  <Text style={styles.profileButtonText}>
                    {formPhotoUri ? 'Fotoğraf seçildi' : 'Fotoğraf ekle'}
                  </Text>
                </TouchableOpacity>
                {formPhotoUri ? <Text style={styles.muted}>Günlük foto yüklenecek</Text> : null}
              </View>
            </View>
            <TouchableOpacity
              style={[styles.profileButton, styles.profileAnalyzeButton, { paddingHorizontal: 18 }]}
              onPress={addFormLog}
            >
              <Text style={styles.profileButtonText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
          {formError ? <Text style={styles.error}>{formError}</Text> : null}
          {formEntries.length > 0 ? (
            <View style={styles.formList}>
              {formEntries.map((entry, index) => (
                <View key={`${entry.date}-${entry.createdAt || index}`} style={styles.formEntryRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formEntryDate}>{entry.date}</Text>
                    <Text style={styles.formEntryStatus}>{entry.status}</Text>
                    {entry.photoUri || entry.photoBase64 ? (
                      <View style={styles.formPhotoRow}>
                        <Image
                          source={{ uri: entry.photoBase64 ? `data:image/jpeg;base64,${entry.photoBase64}` : entry.photoUri }}
                          style={styles.formEntryImage}
                        />
                        <Text style={styles.muted}>Foto kaydedildi</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.sectionTag}>Henüz form kaydı yok.</Text>
          )}
        </View>

        {parsedResult.score ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Skor</Text>
            <Text style={styles.bigNumber}>{parsedResult.score}</Text>
            <Text style={styles.muted}>Ollama’dan gelen skor</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

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
    height: 220,
    borderBottomLeftRadius: 48,
    borderBottomRightRadius: 48,
    opacity: 0.95,
  },
  content: {
    paddingHorizontal: horizontalPadding,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 13,
    color: '#cbd5e1',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#0ea5e9',
  },
  statusBadgeError: {
    backgroundColor: '#ef4444',
  },
  statusBadgeLoading: {
    backgroundColor: '#f59e0b',
  },
  statusText: {
    color: '#0b1120',
    fontWeight: '700',
    fontSize: 12,
  },
  card: {
    backgroundColor: '#0c1a32',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
    padding: 16,
    shadowColor: '#020617',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  sectionTag: {
    fontSize: 12,
    color: '#94a3b8',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  preview: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: '#1f2937',
  },
  cardText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
  },
  muted: {
    color: '#94a3b8',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
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
  error: {
    marginTop: 6,
    color: '#fca5a5',
    fontSize: 12,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  formDateBox: {
    width: 120,
    backgroundColor: '#0c1a32',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
  },
  formDateLabel: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 2,
  },
  formDateValue: {
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 13,
  },
  formTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formTypeChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
    backgroundColor: '#0c1a32',
  },
  formTypeChipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  formTypeChipText: {
    color: '#e2e8f0',
    fontWeight: '600',
    fontSize: 12,
  },
  formTypeChipTextActive: {
    color: '#0b1120',
  },
  formList: {
    marginTop: 8,
    gap: 8,
  },
  formActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  formEntryRow: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0c1a32',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
  },
  formEntryDate: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
  },
  formEntryStatus: {
    color: '#e2e8f0',
    fontWeight: '700',
  },
  formPhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  formEntryImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#1f2937',
  },
  bigNumber: {
    fontSize: 34,
    fontWeight: '800',
    color: '#10b981',
    marginTop: 6,
  },
});
