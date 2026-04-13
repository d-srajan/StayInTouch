import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { runMigrations } from "@/src/db/migrate";
import { useOnboarding } from "@/src/hooks/useOnboarding";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const { isComplete } = useOnboarding();
  const isNavigating = useRef(false);

  useEffect(() => {
    runMigrations();
  }, []);

  // Redirect based on onboarding state
  useEffect(() => {
    if (isComplete === null) return; // still loading
    if (isNavigating.current) return; // already navigating, don't fight

    const inOnboarding = segments[0] === ("onboarding" as string);

    if (!isComplete && !inOnboarding) {
      isNavigating.current = true;
      router.replace("/onboarding" as any);
      // Reset after navigation settles
      setTimeout(() => { isNavigating.current = false; }, 500);
    } else if (isComplete && inOnboarding) {
      isNavigating.current = true;
      router.replace("/(tabs)");
      setTimeout(() => { isNavigating.current = false; }, 500);
    }
  }, [isComplete, segments, router]);

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
