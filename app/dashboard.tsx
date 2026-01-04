import AsyncStorage from "@react-native-async-storage/async-storage";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useEffect, useState } from "react";
import { TouchableOpacity, Text, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import AnalysisScreen from "../src/screens/AnalysisScreen";
import Dashboard from "../src/screens/Dashboard";
import ProfileScreen from "../src/screens/ProfileScreen";
import CalorieSearch from "../src/screens/CalorieSearch";
import { updateUserProfile } from "../src/firebase/service";
import CoachBot from "../src/components/CoachBot";

type Profile = {
  age: string;
  height: string;
  weight: string;
  gender: string;
  goalType: string;
  profilePhoto?: string | null;
};

type Session = {
  userId: string;
  name?: string;
  username?: string;
  goal?: string;
  programId?: string | null;
  assignedTrainerId?: string | null;
};

type DailyGoals = {
  stepsTarget: number;
  workoutMinutesTarget: number;
  waterTargetLiters: number;
};

function calculateDailyGoals(profile: Profile): DailyGoals {
  const goal = profile.goalType;
  const weightKg = profile.weight ? Number(profile.weight) : null;
  const waterFromWeight = Number.isFinite(weightKg)
    ? Number((weightKg * 0.04).toFixed(1))
    : null;

  if (goal === "gain_muscle") {
    return {
      stepsTarget: 7000,
      workoutMinutesTarget: 45,
      waterTargetLiters: waterFromWeight ?? 2.8,
    };
  }
  if (goal === "maintain") {
    return {
      stepsTarget: 7000,
      workoutMinutesTarget: 30,
      waterTargetLiters: waterFromWeight ?? 2.2,
    };
  }
  return {
    stepsTarget: 9000,
    workoutMinutesTarget: 35,
    waterTargetLiters: waterFromWeight ?? 2.5,
  };
}

const Tab = createBottomTabNavigator();

const PROFILE_STORAGE_KEY = "fitadvisor:profile";
const SESSION_KEY = "fitadvisor:session";
const USERS_KEY = "fitadvisor:users";

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile>({
    age: "25",
    height: "175",
    weight: "70",
    gender: "male",
    goalType: "maintain",
  });
  const goals = calculateDailyGoals(profile);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.age && parsed?.height && parsed?.weight) {
            setProfile(parsed);
          }
        }
      } catch {
        // ignore
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const stored = await AsyncStorage.getItem(SESSION_KEY);
        if (stored) {
          setSession(JSON.parse(stored));
        }
      } catch {
        // ignore
      }
    };
    loadSession();
  }, []);


  const handleUpdateProfile = async (updated: Profile) => {
    const updatedWithPhoto: Profile = { ...profile, ...updated };
    setProfile(updatedWithPhoto);
    try {
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedWithPhoto));
      if (session) {
        const nextSession = { ...session, goal: updated.goalType, profilePhoto: updatedWithPhoto.profilePhoto };
        setSession(nextSession);
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      }
      if (session?.userId) {
        const storedUsers = await AsyncStorage.getItem(USERS_KEY);
        const list = storedUsers ? JSON.parse(storedUsers) : [];
        if (Array.isArray(list)) {
          const nextUsers = list.map((u: any) =>
            u.id === session.userId
              ? {
                  ...u,
                  age: updatedWithPhoto.age,
                  goal: updatedWithPhoto.goalType,
                  height: updatedWithPhoto.height,
                  weight: updatedWithPhoto.weight,
                  gender: updatedWithPhoto.gender,
                  profilePhoto: updatedWithPhoto.profilePhoto,
                }
              : u
          );
          await AsyncStorage.setItem(USERS_KEY, JSON.stringify(nextUsers));
        }
        await updateUserProfile(session.userId, {
          age: updatedWithPhoto.age,
          height: updatedWithPhoto.height,
          weight: updatedWithPhoto.weight,
          gender: updatedWithPhoto.gender,
          goalType: updatedWithPhoto.goalType,
          profilePhoto: updatedWithPhoto.profilePhoto || null,
        });
      }
    } catch {
      // ignore
    }
  };


  const handleLogout = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(SESSION_KEY),
        AsyncStorage.removeItem(PROFILE_STORAGE_KEY),
        AsyncStorage.removeItem("fitadvisor:trainerSession"),
      ]);
    } catch {
      // ignore
    } finally {
      router.replace("/login");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0a1428" }}>
      <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#22c55e",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          backgroundColor: "#0b1220",
          borderTopColor: "#1f2937",
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, Platform.OS === "android" ? 16 : 10),
          height: 64 + Math.max(insets.bottom, Platform.OS === "android" ? 16 : 10),
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },
        sceneContainerStyle: { backgroundColor: "#0a1428" },
      }}
    >
      <Tab.Screen
        name="Ana"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={18} color={color} />
          ),
        }}
      >
        {() => <Dashboard profile={profile} goals={goals} />}
      </Tab.Screen>
      <Tab.Screen
        name="Kalori"
        component={CalorieSearch}
        options={{
          title: "Kalori",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "flame" : "flame-outline"} size={18} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Analiz"
        component={AnalysisScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "analytics" : "analytics-outline"} size={18} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profil"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={18} color={color} />
          ),
        }}
      >
        {() => <ProfileScreen profile={profile} onUpdateProfile={handleUpdateProfile} />}
      </Tab.Screen>
    </Tab.Navigator>
      <CoachBot />
    </View>
  );
}



