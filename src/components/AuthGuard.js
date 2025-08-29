import React from "react";
import { Redirect } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { View, ActivityIndicator } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

export default function AuthGuard({ children }) {
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

  // If user is already authenticated, redirect to main app
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  // If user is not authenticated, show the auth screen
  return children;
}
