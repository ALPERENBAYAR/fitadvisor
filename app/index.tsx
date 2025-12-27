import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

export default function Index() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  return (
    <View style={[styles.container, colorScheme === 'dark' && styles.containerDark]}>
      <LinearGradient
        colors={['#0b1220', '#0b192b']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />
      <View style={styles.content}>
        <Text style={styles.badge}>FA</Text>
        <Text style={styles.title}>FitAdvisor</Text>
        <Text style={styles.subtitle}>
          Koyu mavi + turkuaz temayla fitness yolculugunu surdur. Kullanici veya Trainer girisi yap.
        </Text>

        <View style={styles.buttonContainer}>
          <Pressable style={[styles.button, styles.primaryButton]} onPress={() => router.push('/login')}>
            <Text style={styles.buttonText}>Kullanici Girisi</Text>
          </Pressable>

          <Pressable style={[styles.button, styles.secondaryButton]} onPress={() => router.push('/trainer-login')}>
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Trainer Girisi</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerDark: {
    backgroundColor: '#0b1220',
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#0ea5e9',
    opacity: 0.18,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -140,
    right: -100,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#10b981',
    opacity: 0.14,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    width: 360,
    gap: 12,
  },
  badge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0ea5e9',
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#0b1220',
    fontSize: 20,
    fontWeight: '800',
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  title: {
    fontSize: 42,
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
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  secondaryButton: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#38bdf8',
  },
});
