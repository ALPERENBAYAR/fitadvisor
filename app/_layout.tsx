import { Stack } from 'expo-router';
import { SafeAreaView, StatusBar, useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <Stack>
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
        <Stack.Screen name="onboarding" options={{ title: 'Onboarding', headerShown: false }} />
      </Stack>
    </SafeAreaView>
  );
}

