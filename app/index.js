import { useEffect } from "react";
import { Redirect } from "expo-router";
import { useAuth } from "../src/contexts/AuthContext";
import { View, ActivityIndicator } from "react-native";
import { useTheme } from "../src/contexts/ThemeContext";

export default function Index() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/auth" />;
}
