import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
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
const API_COLORS = {
  bg: '#0b1220',
  card: '#0f172a',
  border: '#1f2937',
  text: '#f8fafc',
  subtext: '#cbd5e1',
  muted: '#94a3b8',
  primary: '#10b981',
  info: '#0ea5e9',
  dark: '#0b1120',
};

const PROGRAMS = [
  {
    id: 'fullbody-3',
    title: 'Full Body • 3 Gün',
    level: 'Başlangıç / Orta seviye',
    description: 'Tüm vücut odaklı, haftada 3 gün yapılacak güç ve dayanıklılık programı.',
    days: [
      {
        label: 'Gün 1 • Üst vücut ağırlık',
        exercises: ['Isınma: 5 dk hafif yürüyüş', 'Şınav • 3 x 10-12', 'Dumbbell Row • 3 x 12', 'Omuz Press • 3 x 12'],
      },
      {
        label: 'Gün 2 • Alt vücut & core',
        exercises: ['Isınma: 5 dk hafif koşu', 'Squat • 3 x 12', 'Lunge • 3 x 10 (bacak başına)', 'Plank • 3 x 30 sn'],
      },
      {
        label: 'Gün 3 • Tüm vücut hafif',
        exercises: ['Isınma: 10 dk tempolu yürüyüş', 'Kettlebell Deadlift • 3 x 12', 'Incline Push-up • 3 x 12', 'Side Plank • 3 x 20 sn'],
      },
    ],
  },
  {
    id: 'split-4',
    title: 'Split • 4 Gün',
    level: 'Orta / İleri seviye',
    description: 'Bölgesel antrenman programı. Haftada 4 gün, farklı kas gruplarına odaklanarak çalışma.',
    days: [
      {
        label: 'Gün 1 • Göğüs & Triceps',
        exercises: ['Isınma: 10 dk dinamik esneme', 'Bench Press • 4 x 8-10', 'Incline Dumbbell Press • 3 x 12', 'Triceps Pushdown • 3 x 15'],
      },
      {
        label: 'Gün 2 • Sırt & Biceps',
        exercises: ['Isınma: 10 dk rowing machine', 'Pull-ups • 4 x max', 'Barbell Row • 3 x 10', 'Bicep Curl • 3 x 12'],
      },
      {
        label: 'Gün 3 • Bacak',
        exercises: ['Isınma: 10 dk bisiklet', 'Back Squat • 4 x 8-10', 'Romanian Deadlift • 3 x 12', 'Leg Press • 3 x 15'],
      },
      {
        label: 'Gün 4 • Omuz & Core',
        exercises: ['Isınma: 10 dk dinamik esneme', 'Overhead Press • 4 x 8-10', 'Lateral Raises • 3 x 15', 'Hanging Leg Raise • 3 x 12'],
      },
    ],
  },
  {
    id: 'fitadvisor-5',
    title: 'FitAdvisor Performans • 5 Gün',
    level: 'Orta seviye',
    description: 'Koşu, kuvvet ve core karışımı; haftada 5 gün, toparlanmaya dikkat ederek performans artırma.',
    days: [
      {
        label: 'Gün 1 • Kuvvet - Üst',
        exercises: ['Isınma: 8 dk mobilite', 'Bench Press • 4 x 8', 'Chin-up • 4 x 6-8', 'Arnold Press • 3 x 12', 'Face Pull • 3 x 15'],
      },
      {
        label: 'Gün 2 • Koşu + Core',
        exercises: ['Isınma: 5 dk yürüyüş', 'Koşu: 20 dk tempo', 'Plank • 3 x 45 sn', 'Deadbug • 3 x 12/12'],
      },
      {
        label: 'Gün 3 • Kuvvet - Alt',
        exercises: ['Isınma: 8 dk bisiklet', 'Front Squat • 4 x 8', 'Romanian Deadlift • 4 x 10', 'Walking Lunge • 3 x 12/12', 'Standing Calf Raise • 4 x 15'],
      },
      {
        label: 'Gün 4 • Interval',
        exercises: ['Isınma: 5 dk koşu', '400m x 6 interval (1:1 dinlenme)', 'Yavaş koşu soğuma: 10 dk', 'Stretching: 8 dk'],
      },
      {
        label: 'Gün 5 • Core + Stabilite',
        exercises: ['Isınma: 5 dk dinamik esneme', 'Pallof Press • 3 x 12/12', 'Side Plank • 3 x 30 sn/yan', 'Hip Thrust • 4 x 12', 'Farmer’s Carry • 3 x 40 sn'],
      },
    ],
  },
];

const USERS_KEY = 'fitadvisor:users';

const hashPassword = (value) => {
  // Demo amaçlı basit djb2 hash — gerçek projede güvenli bir algoritma kullanın.
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
};

export default function ProgramScreen({ selectedProgramId, completedDays, onSelectProgram, onToggleDay }) {
  const selectedProgram = PROGRAMS.find((p) => p.id === selectedProgramId);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    name: '',
    age: '',
    goal: '',
    programId: 'fullbody-3',
    password: '',
  });
  const [message, setMessage] = useState('');
  const dayKey = (programId, index) => `${programId}:${index}`;

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const stored = await AsyncStorage.getItem(USERS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setUsers(parsed);
          }
        }
      } catch {
        // ignore
      }
    };
    loadUsers();
  }, []);

  const saveUsers = async (list) => {
    setUsers(list);
    try {
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  };

  const handleCreateUser = async () => {
    const { name, age, goal, programId, password } = form;
    if (!name.trim() || !age.trim() || !goal.trim() || !password.trim()) {
      setMessage('Lütfen tüm alanları doldur.');
      return;
    }
    const newUser = {
      id: `u-${Date.now()}`,
      name: name.trim(),
      age: age.trim(),
      goal: goal.trim(),
      programId,
      passwordHash: hashPassword(password.trim()),
    };
    const next = [...users, newUser];
    await saveUsers(next);
    setMessage('Kullanıcı oluşturuldu ve veritabanına eklendi.');
    setForm({ name: '', age: '', goal: '', programId: 'fullbody-3', password: '' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Program</Text>
        <Text style={styles.subtitle}>
          Hedefine uygun antrenman programını seç ve ilerlemeyi takip et. Yeni kullanıcılar oluşturup şifrelerini hash’li
          olarak saklayabilirsin.
        </Text>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Yeni kullanıcı oluştur</Text>
            <Text style={styles.sectionTag}>Şifreler hash’li saklanır</Text>
          </View>
          <View style={styles.formRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ad</Text>
              <TextInput
                value={form.name}
                onChangeText={(v) => setForm((prev) => ({ ...prev, name: v }))}
                placeholder="İsim"
                placeholderTextColor="#6b7280"
                style={styles.input}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Yaş</Text>
              <TextInput
                value={form.age}
                onChangeText={(v) => setForm((prev) => ({ ...prev, age: v }))}
                placeholder="25"
                placeholderTextColor="#6b7280"
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hedef</Text>
            <TextInput
              value={form.goal}
              onChangeText={(v) => setForm((prev) => ({ ...prev, goal: v }))}
              placeholder="Kilo koruma / Kas kazanma / Performans"
              placeholderTextColor="#6b7280"
              style={styles.input}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Program</Text>
            <View style={styles.programSelectRow}>
              {PROGRAMS.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.programChip, form.programId === p.id && styles.programChipActive]}
                  onPress={() => setForm((prev) => ({ ...prev, programId: p.id }))}
                >
                  <Text style={[styles.programChipText, form.programId === p.id && styles.programChipTextActive]}>
                    {p.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Şifre</Text>
            <TextInput
              value={form.password}
              onChangeText={(v) => setForm((prev) => ({ ...prev, password: v }))}
              placeholder="******"
              placeholderTextColor="#6b7280"
              secureTextEntry
              style={styles.input}
            />
          </View>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateUser}>
            <Text style={styles.createButtonText}>Kullanıcı Oluştur</Text>
          </TouchableOpacity>
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>

        {selectedProgram && (
          <View style={[styles.card, styles.selectedCard]}>
            <View style={styles.selectedHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedTitle}>{selectedProgram.title}</Text>
                <Text style={styles.selectedLevel}>{selectedProgram.level}</Text>
              </View>
              <TouchableOpacity style={styles.changeButton} onPress={() => onSelectProgram(null)}>
                <Text style={styles.changeButtonText}>Değiştir</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.selectedDescription}>{selectedProgram.description}</Text>
          </View>
        )}

        {!selectedProgram && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Programını seç</Text>
            <View style={styles.programsList}>
              {PROGRAMS.map((program) => (
                <TouchableOpacity
                  key={program.id}
                  style={[styles.programCard, selectedProgramId === program.id && styles.selectedCard]}
                  onPress={() => onSelectProgram({ id: program.id, title: program.title })}
                >
                  <Text style={styles.programTitle}>{program.title}</Text>
                  <Text style={styles.programLevel}>{program.level}</Text>
                  <Text style={styles.programDescription}>{program.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {selectedProgram && (
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Antrenman Günleri</Text>
              <Text style={styles.sectionTag}>Tamamla ve işaretle</Text>
            </View>
            {selectedProgram.days.map((day, index) => {
              const key = dayKey(selectedProgram.id, index);
              const isDone = !!completedDays[key];
              return (
                <View key={key} style={[styles.dayCard, isDone && styles.dayCardDone]}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayLabel}>{day.label}</Text>
                    <TouchableOpacity style={[styles.doneButton, isDone && styles.doneButtonActive]} onPress={() => onToggleDay(key)}>
                      <Text style={[styles.doneButtonText, isDone && styles.doneButtonTextActive]}>
                        {isDone ? 'Tamamlandı' : 'Yapılmadı'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.exercisesList}>
                    {day.exercises.map((exercise, exerciseIndex) => (
                      <View key={exerciseIndex} style={styles.bulletRow}>
                        <View style={styles.bulletDot} />
                        <Text style={styles.exerciseText}>{exercise}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const horizontalPadding = width < 380 ? 16 : 24;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: API_COLORS.bg,
  },
  content: {
    paddingHorizontal: horizontalPadding,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: API_COLORS.text,
  },
  subtitle: {
    fontSize: 15,
    color: API_COLORS.subtext,
    marginBottom: 6,
    lineHeight: 22,
  },
  card: {
    backgroundColor: API_COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: API_COLORS.border,
    gap: 8,
    shadowColor: '#020617',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
  },
  selectedCard: {
    borderColor: API_COLORS.primary,
    shadowColor: API_COLORS.dark,
    shadowOpacity: 0.35,
    shadowRadius: 18,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  selectedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: API_COLORS.text,
  },
  selectedLevel: {
    fontSize: 13,
    color: API_COLORS.muted,
  },
  selectedDescription: {
    fontSize: 14,
    color: API_COLORS.subtext,
    lineHeight: 20,
  },
  changeButton: {
    backgroundColor: API_COLORS.info,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  changeButtonText: {
    fontSize: 12,
    color: API_COLORS.dark,
    fontWeight: '700',
  },
  programsList: {
    gap: 12,
    marginTop: 8,
  },
  programCard: {
    backgroundColor: API_COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: API_COLORS.border,
  },
  programTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: API_COLORS.text,
    marginBottom: 4,
  },
  programLevel: {
    fontSize: 13,
    color: API_COLORS.muted,
    marginBottom: 6,
  },
  programDescription: {
    fontSize: 14,
    color: API_COLORS.subtext,
    lineHeight: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputGroup: {
    flex: 1,
    marginTop: 10,
  },
  label: {
    fontSize: 13,
    color: API_COLORS.subtext,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: API_COLORS.border,
    color: API_COLORS.text,
  },
  programSelectRow: {
    flexDirection: 'column',
    gap: 8,
  },
  programChip: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: API_COLORS.border,
  },
  programChipActive: {
    borderColor: API_COLORS.primary,
    backgroundColor: API_COLORS.card,
  },
  programChipText: {
    color: API_COLORS.subtext,
    fontSize: 13,
    fontWeight: '600',
  },
  programChipTextActive: {
    color: API_COLORS.primary,
  },
  createButton: {
    marginTop: 14,
    backgroundColor: API_COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: API_COLORS.dark,
    fontSize: 15,
    fontWeight: '800',
  },
  message: {
    marginTop: 8,
    color: API_COLORS.subtext,
    fontSize: 12,
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
    color: API_COLORS.text,
  },
  sectionTag: {
    fontSize: 12,
    color: API_COLORS.muted,
  },
  dayCard: {
    backgroundColor: API_COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: API_COLORS.border,
    marginBottom: 10,
    gap: 8,
  },
  dayCardDone: {
    borderColor: API_COLORS.primary,
    backgroundColor: API_COLORS.card,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: API_COLORS.text,
    marginBottom: 6,
  },
  doneButton: {
    borderWidth: 1,
    borderColor: API_COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#0ea5e91a',
  },
  doneButtonActive: {
    backgroundColor: '#10b98133',
    borderColor: API_COLORS.primary,
  },
  doneButtonText: {
    fontSize: 12,
    color: API_COLORS.text,
    fontWeight: '700',
  },
  doneButtonTextActive: {
    color: API_COLORS.primary,
  },
  exercisesList: {
    gap: 8,
    marginTop: 4,
  },
  exerciseText: {
    fontSize: 14,
    color: API_COLORS.subtext,
    lineHeight: 20,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: API_COLORS.primary,
    marginTop: 6,
  },
});
