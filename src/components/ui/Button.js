import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  style,
  textStyle,
  ...props
}) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    button: {
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      ...getButtonStyle(variant, size, theme),
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    text: {
      fontWeight: "600",
      ...getTextStyle(variant, size, theme),
    },
    loading: {
      marginRight: 8,
    },
  });

  function getButtonStyle(variant, size, theme) {
    const baseStyle = {
      paddingHorizontal: size === "small" ? 16 : size === "large" ? 24 : 20,
      paddingVertical: size === "small" ? 8 : size === "large" ? 16 : 12,
    };

    switch (variant) {
      case "primary":
        return {
          ...baseStyle,
          backgroundColor: theme.colors.primary,
        };
      case "secondary":
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
        };
      case "outline":
        return {
          ...baseStyle,
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: theme.colors.primary,
        };
      case "danger":
        return {
          ...baseStyle,
          backgroundColor: theme.colors.error,
        };
      case "ghost":
        return {
          ...baseStyle,
          backgroundColor: "transparent",
        };
      default:
        return baseStyle;
    }
  }

  function getTextStyle(variant, size, theme) {
    const baseStyle = {
      fontSize: size === "small" ? 14 : size === "large" ? 18 : 16,
    };

    switch (variant) {
      case "primary":
      case "danger":
        return {
          ...baseStyle,
          color: theme.colors.onPrimary,
        };
      case "secondary":
        return {
          ...baseStyle,
          color: theme.colors.text,
        };
      case "outline":
      case "ghost":
        return {
          ...baseStyle,
          color: theme.colors.primary,
        };
      default:
        return baseStyle;
    }
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        (disabled || loading) && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={
            variant === "primary" || variant === "danger"
              ? theme.colors.onPrimary
              : theme.colors.primary
          }
          style={styles.loading}
        />
      )}
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}
