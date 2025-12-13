import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

type Exercise = string;

type ProgramDay = {
  label: string;
  exercises: Exercise[];
};

type Program = {
  id: string;
  title: string;
  level: string;
  description: string;
  days: ProgramDay[];
};

type UserPreset = {
  id: string;
  name: string;
  age: number;
  goal: string;
  programId: string;
};

const PROGRAMS: Program[] = [
  {
    id: 'fullbody-3',
    title: 'Full Body • 3 Gün',
    level: 'Başlangıç / Orta seviye',
    description: 'Tüm vücut odaklı, haftada 3 gün yapılacak güç ve dayanıklılık programı.',
    days: [
      {
        label: 'Gün 1 • Üst vücut ağırlık',
        exercises: [
          'Isınma: 5 dk hafif yürüyüş',
          'Şınav • 3 x 10-12',
          'Dumbbell Row • 3 x 12',
          'Omuz Press • 3 x 12',
        ],
      },
      {
        label: 'Gün 2 • Alt vücut & core',
        exercises: [
          'Isınma: 5 dk hafif koşu',
          'Squat • 3 x 12',
          'Lunge • 3 x 10 (bacak başına)',
          'Plank • 3 x 30 sn',
        ],
      },
      {
        label: 'Gün 3 • Tüm vücut hafif',
        exercises: [
          'Isınma: 10 dk tempolu yürüyüş',
          'Kettlebell Deadlift • 3 x 12',
          'Incline Push-up • 3 x 12',
          'Side Plank • 3 x 20 sn',
        ],
      },
    ],
  },
  {
    id: 'split-4',
    title: 'Split • 4 Gün',
    level: 'Orta / İleri seviye',
    description:
      'Bölgesel antrenman programı. Haftada 4 gün, farklı kas gruplarına odaklanarak çalışma.',
    days: [
      {
        label: 'Gün 1 • Göğüs & Triceps',
        exercises: [
          'Isınma: 10 dk dinamik esneme',
          'Bench Press • 4 x 8-10',
          'Incline Dumbbell Press • 3 x 12',
          'Triceps Pushdown • 3 x 15',
        ],
      },
      {
        label: 'Gün 2 • Sırt & Biceps',
        exercises: [
          'Isınma: 10 dk rowing machine',
          'Pull-ups • 4 x max',
          'Barbell Row • 3 x 10',
          'Bicep Curl • 3 x 12',
        ],
      },
      {
        label: 'Gün 3 • Bacak',
        exercises: [
          'Isınma: 10 dk bisiklet',
          'Back Squat • 4 x 8-10',
          'Romanian Deadlift • 3 x 12',
          'Leg Press • 3 x 15',
        ],
      },
      {
        label: 'Gün 4 • Omuz & Core',
        exercises: [
          'Isınma: 10 dk dinamik esneme',
          'Overhead Press • 4 x 8-10',
          'Lateral Raises • 3 x 15',
          'Hanging Leg Raise • 3 x 12',
        ],
      },
    ],
  },
  {
    id: 'fitadvisor-5',
    title: 'FitAdvisor Performans • 5 Gün',
    level: 'Orta seviye',
    description:
      'Koşu, kuvvet ve core karışımı; haftada 5 gün, toparlanmaya dikkat ederek performans artırma.',
    days: [
      {
        label: 'Gün 1 • Kuvvet - Üst',
        exercises: [
          'Isınma: 8 dk mobilite',
          'Bench Press • 4 x 8',
          'Chin-up • 4 x 6-8',
          'Arnold Press • 3 x 12',
          'Face Pull • 3 x 15',
        ],
      },
      {
        label: 'Gün 2 • Koşu + Core',
        exercises: [
          'Isınma: 5 dk yürüyüş',
          'Koşu: 20 dk tempo',
          'Plank • 3 x 45 sn',
          'Deadbug • 3 x 12/12',
        ],
      },
      {
        label: 'Gün 3 • Kuvvet - Alt',
        exercises: [
          'Isınma: 8 dk bisiklet',
          'Front Squat • 4 x 8',
          'Romanian Deadlift • 4 x 10',
          'Walking Lunge • 3 x 12/12',
          'Standing Calf Raise • 4 x 15',
        ],
      },
      {
        label: 'Gün 4 • Interval',
        exercises: [
          'Isınma: 5 dk koşu',
          '400m x 6 interval (1:1 dinlenme)',
          'Yavaş koşu soğuma: 10 dk',
          'Stretching: 8 dk',
        ],
      },
      {
        label: 'Gün 5 • Core + Stabilite',
        exercises: [
          'Isınma: 5 dk dinamik esneme',
          'Pallof Press • 3 x 12/12',
          'Side Plank • 3 x 30 sn/yan',
          'Hip Thrust • 4 x 12',
          'Farmer’s Carry • 3 x 40 sn',
        ],
      },
    ],
  },
];

const USER_PRESETS: UserPreset[] = [
  { id: 'u1', name: 'Alperen', age: 25, goal: 'Kilo koruma', programId: 'fullbody-3' },
  { id: 'u2', name: 'Ece', age: 27, goal: 'Kas kazanma', programId: 'split-4' },
  { id: 'u3', name: 'Deniz', age: 24, goal: 'Performans', programId: 'fitadvisor-5' },
];

type ProgramScreenProps = {
  selectedProgramId: string | null;
  completedDays: Record<string, boolean>;
  onSelectProgram: (program: { id: string; title: string } | null) => void;
  onToggleDay: (dayKey: string) => void;
};

export default function ProgramScreen({
  selectedProgramId,
  completedDays,
  onSelectProgram,
  onToggleDay,
}: ProgramScreenProps) {
  const selectedProgram = PROGRAMS.find((p) => p.id === selectedProgramId);

  const dayKey = (programId: string, index: number) => `${programId}:${index}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Program</Text>
        <Text style={styles.subtitle}>
          Hedefine uygun antrenman programını seç, kullanıcı verilerini kullan ve ilerlemeyi takip et.
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Kullanıcı veritabanı (preset)</Text>
          <Text style={styles.sectionTag}>Hızlı başlangıç profilleri</Text>
          <View style={styles.presetList}>
            {USER_PRESETS.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={[
                  styles.presetChip,
                  selectedProgramId === user.programId && styles.presetChipActive,
                ]}
                onPress={() =>
                  onSelectProgram({
                    id: user.programId,
                    title: PROGRAMS.find((p) => p.id === user.programId)?.title ?? '',
                  })
                }
              >
                <Text style={styles.presetName}>{user.name}</Text>
                <Text style={styles.presetMeta}>
                  {user.age} • {user.goal} • {PROGRAMS.find((p) => p.id === user.programId)?.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
            <Text style={styles.sectionTitle}>Programı seç</Text>
            <View style={styles.programsList}>
              {PROGRAMS.map((program) => (
                <TouchableOpacity
                  key={program.id}
                  style={styles.programCard}
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
                    <TouchableOpacity
                      style={[styles.doneButton, isDone && styles.doneButtonActive]}
                      onPress={() => onToggleDay(key)}
                    >
                      <Text style={[styles.doneButtonText, isDone && styles.doneButtonTextActive]}>
                        {isDone ? 'Tamamlandı' : 'Yapılmadı'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.exercisesList}>
                    {day.exercises.map((exercise, exerciseIndex) => (
                      <Text key={exerciseIndex} style={styles.exerciseText}>
                        • {exercise}
                      </Text>
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
    backgroundColor: '#0b1220',
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
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 15,
    color: '#cbd5e1',
    marginBottom: 6,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    shadowColor: '#020617',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
  },
  selectedCard: {
    borderColor: '#10b981',
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
    color: '#e2e8f0',
  },
  selectedLevel: {
    fontSize: 13,
    color: '#94a3b8',
  },
  selectedDescription: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  changeButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  changeButtonText: {
    fontSize: 12,
    color: '#0b1120',
    fontWeight: '700',
  },
  programsList: {
    gap: 12,
    marginTop: 8,
  },
  programCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  programTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 4,
  },
  programLevel: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 6,
  },
  programDescription: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
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
  sectionTag: {
    fontSize: 12,
    color: '#94a3b8',
  },
  daysContainer: {
    gap: 16,
  },
  dayCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 10,
  },
  dayCardDone: {
    borderColor: '#10b981',
    backgroundColor: '#0f172a',
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
    color: '#e2e8f0',
    marginBottom: 6,
  },
  doneButton: {
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#0ea5e91a',
  },
  doneButtonActive: {
    backgroundColor: '#10b98133',
    borderColor: '#10b981',
  },
  doneButtonText: {
    fontSize: 12,
    color: '#e2e8f0',
    fontWeight: '700',
  },
  doneButtonTextActive: {
    color: '#10b981',
  },
  exercisesList: {
    gap: 8,
  },
  exerciseText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  presetList: {
    marginTop: 10,
    gap: 10,
  },
  presetChip: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  presetChipActive: {
    borderColor: '#10b981',
    backgroundColor: '#0f172a',
  },
  presetName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  presetMeta: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
});
