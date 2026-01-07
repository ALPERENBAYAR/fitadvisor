import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getConfiguredBase = () =>
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiBaseUrl ||
  // @ts-ignore - manifest is kept for backward compatibility on some Expo versions
  Constants.manifest?.extra?.apiBaseUrl;

const getDebuggerHost = () => {
  const host =
    (Constants.expoConfig as any)?.debuggerHost ||
    (Constants.expoGoConfig as any)?.debuggerHost ||
    // @ts-ignore legacy manifest support
    (Constants.manifest as any)?.debuggerHost;
  if (!host) return null;
  return host.split(':')[0];
};

const getHostFromExpo = () => {
  // expoConfig.hostUri is available in dev builds; falls back to manifest for older SDKs
  const hostUri =
    Constants.expoConfig?.hostUri ||
    // @ts-ignore - manifest is kept for backward compatibility on some Expo versions
    Constants.manifest?.hostUri;
  if (!hostUri) return null;

  // hostUri comes as exp://192.168.x.x:19000 or similar; strip protocol + port
  const withoutProtocol = hostUri.replace(/^[a-zA-Z]+:\/\//, '');
  const [host] = withoutProtocol.split(':');
  return host || null;
};

export const getApiBase = () => {
  if (Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_API_URL_WEB || 'http://localhost:4000';
  }
  const configured = getConfiguredBase();
  if (configured) return configured;

  const host = getHostFromExpo() || getDebuggerHost();
  if (host) return `http://${host}:4000`;

  // Android emulator uses a special loopback; iOS simulator can stay on localhost
  if (Platform.OS === 'android') return 'http://10.0.2.2:4000';
  return 'http://localhost:4000';
};

export const API_BASE = getApiBase();

export const apiUrl = (path: string) => `${API_BASE}${path}`;

export const getUsdaApiKey = () =>
  process.env.EXPO_PUBLIC_USDA_API_KEY ||
  Constants.expoConfig?.extra?.usdaApiKey ||
  // @ts-ignore legacy manifest support
  Constants.manifest?.extra?.usdaApiKey ||
  null;
