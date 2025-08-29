import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { ThemeProvider } from "../src/contexts/ThemeContext";
import { AuthProvider } from "../src/contexts/AuthContext";
import "react-native-url-polyfill/auto";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{
                presentation: "modal",
                headerShown: false,
              }}
            />
          </Stack>
          <StatusBar style="auto" />
          <Toast />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
