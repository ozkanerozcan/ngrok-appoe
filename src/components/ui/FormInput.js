import React, { useRef } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

export default function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = "default",
  error,
  required = false,
  ...props
}) {
  const { theme } = useTheme();
  const inputRef = useRef(null);

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    labelContainer: {
      flexDirection: "row",
      marginBottom: 8,
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.text,
    },
    required: {
      color: theme.colors.error,
      marginLeft: 4,
    },
    input: {
      borderWidth: 1,
      borderColor: error ? theme.colors.error : theme.colors.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
      minHeight: multiline ? 100 : 50,
      textAlignVertical: multiline ? "top" : "center",
    },
    inputFocused: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
    },
    error: {
      marginTop: 4,
      fontSize: 14,
      color: theme.colors.error,
    },
  });

  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.required}>*</Text>}
        </View>
      )}
      <TextInput
        ref={inputRef}
        style={[styles.input, isFocused && styles.inputFocused]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        multiline={multiline}
        keyboardType={keyboardType}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}
