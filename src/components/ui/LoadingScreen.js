import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

export default function LoadingScreen({
  title = "Loading...",
  subtitle,
  icon = "hourglass-outline",
  showIcon = false,
  size = "large",
}) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.background,
      padding: 20,
    },
    content: {
      alignItems: "center",
      justifyContent: "center",
    },
    iconContainer: {
      marginBottom: 16,
      opacity: 0.7,
    },
    spinnerContainer: {
      marginBottom: subtitle ? 16 : 8,
    },
    title: {
      fontSize: 18,
      fontWeight: "500",
      color: theme.colors.text,
      textAlign: "center",
      marginBottom: subtitle ? 4 : 0,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
      maxWidth: 240,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {showIcon && (
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={32} color={theme.colors.primary} />
          </View>
        )}

        <View style={styles.spinnerContainer}>
          <ActivityIndicator size={size} color={theme.colors.primary} />
        </View>

        {title && <Text style={styles.title}>{title}</Text>}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}
