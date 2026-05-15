import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { DashboardBackButton } from "../components/DashboardBackButton";
import { queryClient } from "../lib/queryClient";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#f6f7fb" },
            headerShadowVisible: false,
            headerTintColor: "#2563eb",
            contentStyle: { backgroundColor: "#f6f7fb" },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="sign-up" options={{ headerShown: false }} />
          <Stack.Screen name="verify-email" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="add-rewards" options={{ headerShown: false }} />
          <Stack.Screen name="dashboard" options={{ headerShown: false, title: "Dashboard" }} />
          <Stack.Screen
            name="recommendation/[id]"
            options={{
              title: "Details",
              headerShown: true,
              headerLeft: () => <DashboardBackButton />,
            }}
          />
          <Stack.Screen
            name="rewards-accounts"
            options={{
              title: "Your programs",
              headerShown: true,
              headerLeft: () => <DashboardBackButton />,
            }}
          />
          <Stack.Screen
            name="goal-preferences"
            options={{
              title: "Your goals",
              headerShown: true,
              headerLeft: () => <DashboardBackButton />,
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              title: "Settings",
              headerShown: true,
              headerLeft: () => <DashboardBackButton />,
            }}
          />
          <Stack.Screen
            name="delete-account"
            options={{
              title: "Delete account",
              headerShown: true,
              headerLeft: () => <DashboardBackButton />,
            }}
          />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
