import { Stack, Link } from 'expo-router';
import { SafeAreaView, StatusBar, useColorScheme, TouchableOpacity, Text } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0b1220' },
          headerTitleStyle: { color: '#e2e8f0' },
          headerTintColor: '#e2e8f0',
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Login', headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="trainer-login" options={{ title: 'Trainer Girişi', headerShown: true }} />
        <Stack.Screen name="trainer-register" options={{ title: 'Trainer Oluştur', headerShown: true }} />
        <Stack.Screen name="logout" options={{ title: 'Çıkış Yap', headerShown: true }} />
        <Stack.Screen name="trainer-notifications" options={{ title: 'Trainer Bildirimleri' }} />
        <Stack.Screen name="trainer-students" options={{ title: 'Trainer Öğrencileri' }} />
        <Stack.Screen name="trainer-messages" options={{ title: 'Trainer Mesajları' }} />
        <Stack.Screen name="dashboard" options={{ title: 'Dashboard', headerShown: false }} />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
        <Stack.Screen name="analysis" options={{ title: 'Analysis' }} />
        <Stack.Screen name="sleep-history" options={{ title: 'Uyku Kayıtları' }} />
        <Stack.Screen
          name="calories-burned"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen name="onboarding" options={{ title: 'Onboarding', headerShown: false }} />
      </Stack>
      <Link href="/logout" asChild>
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 8,
            right: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: 'rgba(239,68,68,0.92)',
            borderRadius: 12,
          }}
          activeOpacity={0.8}
        >
          <Text style={{ color: '#0b1120', fontWeight: '800' }}>Çıkış</Text>
        </TouchableOpacity>
      </Link>
    </SafeAreaView>
  );
}
