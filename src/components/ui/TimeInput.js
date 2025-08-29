import React, { useState, useRef, useEffect } from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

export default function TimeInput({
  value = "",
  onChangeText,
  placeholder = "H,MM",
  style,
  ...props
}) {
  const { theme } = useTheme();
  const [displayValue, setDisplayValue] = useState("");
  const inputRef = useRef(null);

  // Format input as user types
  const formatInput = (input) => {
    // Allow numbers and comma
    const cleaned = input.replace(/[^0-9,]/g, "");

    // Handle comma placement
    if (cleaned.includes(",")) {
      const parts = cleaned.split(",");
      const hours = parts[0] || "0";
      const minutes = parts[1] || "";

      if (minutes.length > 2) {
        return `${hours},${minutes.slice(0, 2)}`;
      }
      return `${hours},${minutes}`;
    }

    // No comma yet, format based on length
    if (cleaned.length === 0) return "";
    if (cleaned.length === 1) return cleaned;
    if (cleaned.length === 2) return cleaned;
    if (cleaned.length === 3) return `${cleaned[0]},${cleaned.slice(1)}`;
    if (cleaned.length >= 4)
      return `${cleaned.slice(0, 2)},${cleaned.slice(2, 4)}`;

    return cleaned;
  };

  // Update display when value prop changes
  useEffect(() => {
    if (value) {
      // If value is a decimal (from database), convert to H,MM format
      if (typeof value === "number" || !isNaN(parseFloat(value))) {
        const decimal = parseFloat(value);
        const hours = Math.floor(decimal);
        const minutes = Math.round((decimal - hours) * 60);
        setDisplayValue(`${hours},${minutes.toString().padStart(2, "0")}`);
      } else if (value.includes(",")) {
        // If already in H,MM format
        setDisplayValue(value);
      } else {
        setDisplayValue("");
      }
    } else {
      setDisplayValue("");
    }
  }, [value]);

  const handleTextChange = (text) => {
    // Format the display
    const formatted = formatInput(text);
    setDisplayValue(formatted);

    // Convert H,MM to decimal for parent component
    if (formatted.includes(",")) {
      const [hours, minutes] = formatted.split(",");
      const decimalHours =
        parseInt(hours || "0", 10) + parseInt(minutes || "0", 10) / 60;
      onChangeText(decimalHours.toString());
    } else if (formatted.length === 1) {
      // Single digit, treat as hours
      onChangeText(formatted);
    } else if (formatted.length === 2) {
      // Two digits, treat as hours
      onChangeText(formatted);
    } else {
      onChangeText("");
    }
  };

  const styles = StyleSheet.create({
    container: {
      position: "relative",
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minHeight: 50,
      textAlign: "center",
      fontFamily: "monospace", // Monospace for consistent character spacing
    },
    clearButton: {
      position: "absolute",
      right: 12,
      top: "50%",
      transform: [{ translateY: -12 }],
      padding: 4,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={displayValue}
        onChangeText={handleTextChange}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType="numeric"
        maxLength={4}
        {...props}
      />
      {displayValue ? (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => {
            setDisplayValue("");
            onChangeText("");
          }}
        >
          <Ionicons
            name="close-circle"
            size={20}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
