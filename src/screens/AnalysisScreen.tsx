import { Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function AnalysisScreen() {
  const weeklyData = [70, 62, 55, 80, 65, 50, 72];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Analiz</Text>
        <Text style={styles.subtitle}>
          Adım, antrenman ve sağlık skorunun zaman içindeki değişimini burada takip edeceksin.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Haftalık sağlık skoru</Text>

          <View style={styles.barRow}>
            {weeklyData.map((value, index) => (
              <View key={index} style={styles.barItem}>
                <View style={[styles.bar, { height: 40 + (value / 100) * 60 }]} />
                <Text style={styles.barLabel}>G{index + 1}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.cardText}>
            Skorun genel olarak dengeli görünüyor. Hedefine göre bu alanı daha detaylı
            raporlarla zenginleştireceğiz.
          </Text>
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 20,
  },
  barRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 12,
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  bar: {
    width: 20,
    backgroundColor: '#16a34a',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  cardText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});
