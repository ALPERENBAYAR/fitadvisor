import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COACH_ENABLED_KEY = 'fitadvisor:coachbotEnabled';
const TODAY_STATS_KEY = 'fitadvisor:todayStats';
const WATCH_SNAPSHOT_KEY = 'fitadvisor:watchSnapshot';

const avatarSource = require('../../assets/images/kizgin-antrenor.png');

const buildWarning = (stats: any) => {
  if (!stats) return null;
  const stepsTarget = Number(stats.stepsTarget || 0);
  const waterTarget = Number(stats.waterTarget || 0);
  const caloriesTarget = Number(stats.caloriesTarget || 0);
  const steps = Number(stats.steps || 0);
  const water = Number(stats.waterLiters || 0);
  const calories = Number(stats.calories || 0);

  if (stepsTarget > 0 && steps / stepsTarget < 0.6) {
    return 'Adimlar dusuk. Kalk, 10 dk tempolu yuru ve ritmi toparla.';
  }
  if (waterTarget > 0 && water / waterTarget < 0.6) {
    return 'Su icimi dusuk. Hemen bir bardak su ic, bahane yok.';
  }
  if (caloriesTarget > 0 && calories > caloriesTarget) {
    return 'Kalori hedefini astin. Simdi frene bas, daha temiz secimler yap.';
  }
  return null;
};

export default function CoachBot() {
  const insets = useSafeAreaInsets();
  const [enabled, setEnabled] = useState(true);
  const [open, setOpen] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const lastAlertRef = useRef<number>(0);

  const bottomOffset = Math.max(insets.bottom, 12) + 72;

  useEffect(() => {
    let mounted = true;
    const loadEnabled = async () => {
      try {
        const stored = await AsyncStorage.getItem(COACH_ENABLED_KEY);
        if (!mounted || stored === null) return;
        setEnabled(stored !== 'false');
      } catch {
        // ignore
      }
    };
    loadEnabled();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadStats = async () => {
      try {
        const raw = await AsyncStorage.getItem(TODAY_STATS_KEY);
        const watchRaw = await AsyncStorage.getItem(WATCH_SNAPSHOT_KEY);
        if (!active || !raw) return;
        const parsed = JSON.parse(raw);
        const stats = parsed?.stats || parsed;
        const watch = watchRaw ? JSON.parse(watchRaw) : null;
        const effective = { ...stats };
        if (watch && Number.isFinite(Number(watch.steps))) {
          effective.steps = Number(watch.steps);
        }
        const warn = buildWarning(effective);
        if (warn) {
          const now = Date.now();
          if (now - lastAlertRef.current > 10 * 60 * 1000) {
            lastAlertRef.current = now;
            setWarning(warn);
            setOpen(true);
          }
        } else {
          setWarning(null);
        }
      } catch {
        // ignore
      }
    };
    loadStats();
    const timer = setInterval(loadStats, 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const headerText = useMemo(() => (warning ? 'Kizgin Antrenor' : 'Kizgin Antrenor'), [warning]);

  if (!enabled) return null;

  return (
    <View pointerEvents="box-none" style={styles.root}>
      {open ? (
        <View style={[styles.chatPanel, { bottom: bottomOffset }]}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>{headerText}</Text>
            <Pressable onPress={() => setOpen(false)}>
              <Text style={styles.closeText}>Kapat</Text>
            </Pressable>
          </View>
          <View style={styles.chatBody}>
            <View style={[styles.bubble, styles.bubbleBot]}>
              <Text style={styles.bubbleText}>
                {warning || 'Gunluk hedeflerini tamamlamayi unutma.'}
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      <Pressable
        onPress={() => setOpen((prev) => !prev)}
        style={[styles.avatarButton, { bottom: bottomOffset }]}
      >
        <Image source={avatarSource} style={styles.avatarImage} />
        {warning ? <View style={styles.alertDot} /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    right: 16,
    left: 16,
    top: 0,
    bottom: 0,
    zIndex: 20,
    pointerEvents: 'box-none',
  },
  avatarButton: {
    position: 'absolute',
    right: 12,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  alertDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  chatPanel: {
    position: 'absolute',
    right: 12,
    width: 280,
    backgroundColor: '#0b1220',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    padding: 12,
    gap: 10,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatTitle: {
    color: '#e2e8f0',
    fontWeight: '800',
    fontSize: 14,
  },
  closeText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  chatBody: {
    gap: 8,
    maxHeight: 220,
  },
  bubble: {
    padding: 10,
    borderRadius: 12,
  },
  bubbleBot: {
    alignSelf: 'flex-start',
    backgroundColor: '#1f2937',
  },
  bubbleText: {
    color: '#f8fafc',
    fontSize: 12,
  },
});
