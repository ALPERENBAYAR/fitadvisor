import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Onboarding from '../src/screens/Onboarding';

type Profile = {
  age: string;
  height: string;
  weight: string;
  gender: string;
  goalType: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  
  // Eğer profil zaten varsa, onboarding'i atla
  useEffect(() => {
    const skipIfProfileExists = async () => {
      try {
        const stored = await AsyncStorage.getItem('fitadvisor:profile');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.age && parsed?.height && parsed?.weight && parsed?.goalType) {
            router.replace('/dashboard');
          }
        }
      } catch {
        // ignore
      }
    };
    skipIfProfileExists();
  }, [router]);
  
  return (
    <Onboarding 
      onComplete={(profile: Profile) => {
        const persistProfile = async () => {
          try {
            await AsyncStorage.setItem('fitadvisor:profile', JSON.stringify(profile));
          } catch (error) {
            // Non-blocking: continue navigation even if persistence fails
          } finally {
            router.push('/dashboard');
          }
        };

        persistProfile();
      }}
    />
  );
}
