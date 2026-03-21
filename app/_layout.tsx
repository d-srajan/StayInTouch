import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { runMigrations } from "@/src/db/migrate";
import { useOnboarding } from "@/src/hooks/useOnboarding";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const { isComplete } = useOnboarding();

  useEffect(() => {
    runMigrations();
  }, []);

  // Redirect based on onboarding state
  useEffect(() => {
    if (isComplete === null) return; // still loading

    const inOnboarding = segments[0] === ("onboarding" as string);

    if (!isComplete && !inOnboarding) {
      // Not onboarded yet — send to onboarding
      router.replace("/onboarding" as any);
    } else if (isComplete && inOnboarding) {
      // Already onboarded — go to main app
      router.replace("/(tabs)");
    }
  }, [isComplete, segments, router]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="contact/[id]"
          options={{ presentation: "card", title: "" }}
        />
        <Stack.Screen
          name="compose/[id]"
          options={{ presentation: "modal", title: "Compose" }}
        />
        <Stack.Screen
          name="backup"
          options={{ presentation: "card", title: "Backup & Restore", headerShown: false }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
