import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#081225', '#0b1c35', '#0f2a4a']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />
      <View style={styles.streakContainer}>
        {STREAKS.map((streak, index) => (
          <View
            key={`${streak.rotate}-${index}`}
            style={[
              styles.streak,
              {
                height: streak.size,
                opacity: streak.opacity,
                transform: [{ rotate: `${streak.rotate}deg` }],
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.iconCloud}>
        {ICON_CLOUD.map((icon) => (
          <MaterialCommunityIcons
            key={icon.name}
            name={icon.name as any}
            size={icon.size}
            color={icon.color}
            style={[styles.iconCloudItem, { top: icon.top, left: icon.left, right: icon.right, bottom: icon.bottom }]}
          />
        ))}
      </View>
      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <View style={styles.logoRing} />
          <View style={styles.logoRingThin} />
          <View style={styles.badge}>
            <MaterialCommunityIcons name="run-fast" size={36} color="#e2e8f0" />
          </View>
        </View>
        <Text style={styles.title}>FitAdvisor</Text>
        <Text style={styles.subtitle}>
          Disiplin, tempo ve odak. Hedeflerini netlestir ve yolculuga simdi basla.
        </Text>

        <View style={styles.buttonContainer}>
          <Pressable style={[styles.button, styles.primaryButton]} onPress={() => router.push('/login')}>
            <Text style={styles.primaryButtonText}>Kullanici Girisi</Text>
          </Pressable>

          <Pressable style={[styles.button, styles.secondaryButton]} onPress={() => router.push('/trainer-login')}>
            <Text style={styles.secondaryButtonText}>Trainer Girisi</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const STREAKS = [
  { rotate: -70, size: 220, opacity: 0.4 },
  { rotate: -50, size: 180, opacity: 0.35 },
  { rotate: -35, size: 160, opacity: 0.3 },
  { rotate: -15, size: 120, opacity: 0.22 },
  { rotate: 10, size: 140, opacity: 0.28 },
  { rotate: 30, size: 190, opacity: 0.32 },
  { rotate: 50, size: 240, opacity: 0.35 },
  { rotate: 70, size: 200, opacity: 0.3 },
];

const ICON_CLOUD = [
  { name: 'dumbbell', size: 120, color: 'rgba(148,197,255,0.08)', top: -20, left: 18 },
  { name: 'heart-pulse', size: 140, color: 'rgba(148,197,255,0.06)', top: 20, right: 16 },
  { name: 'weight-lifter', size: 160, color: 'rgba(148,197,255,0.05)', bottom: -10, left: 12 },
  { name: 'run', size: 110, color: 'rgba(148,197,255,0.08)', bottom: 40, right: 24 },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#081225',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowTop: {
    position: 'absolute',
    top: -140,
    left: -100,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#1d4ed8',
    opacity: 0.2,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -160,
    right: -120,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#38bdf8',
    opacity: 0.18,
  },
  streakContainer: {
    position: 'absolute',
    width: 380,
    height: 380,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streak: {
    position: 'absolute',
    width: 2,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  iconCloud: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  iconCloudItem: {
    position: 'absolute',
  },
  logoWrap: {
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoRing: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: '#38bdf8',
  },
  logoRingThin: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.6)',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    width: 360,
    gap: 12,
  },
  badge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.4,
    shadowRadius: 18,
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: '#e2e8f0',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#cbd5e1',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#38bdf8',
    shadowColor: '#38bdf8',
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  secondaryButton: {
    backgroundColor: 'rgba(15,23,42,0.75)',
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  primaryButtonText: {
    color: '#0b1120',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  secondaryButtonText: {
    color: '#bae6fd',
    fontSize: 16,
    fontWeight: '700',
  },
});
