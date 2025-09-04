import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

export default function DurationInput({
  value = "",
  onChangeText,
  style,
  ...props
}) {
  const { theme } = useTheme();
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const hoursInputRef = useRef(null);
  const minutesInputRef = useRef(null);
  const isUserTypingRef = useRef(false);

  // Update hours and minutes when value prop changes (only for external changes)
  useEffect(() => {
    // Don't update if user is currently typing
    if (isUserTypingRef.current) return;

    if (typeof value === "number" && value >= 0) {
      const decimalHours = value;
      const h = Math.floor(decimalHours);
      const m = Math.round((decimalHours - h) * 60);
      setHours(h.toString());
      setMinutes(m.toString().padStart(2, "0"));
    } else if (value && typeof value === "string") {
      // Handle comma format (e.g., "1,30")
      if (value.includes(",")) {
        const [h, m] = value.split(",");
        setHours(h || "0");
        setMinutes((m || "0").padStart(2, "0"));
      }
      // Handle decimal format (e.g., "1.5")
      else if (!isNaN(parseFloat(value))) {
        const decimalHours = parseFloat(value);
        const h = Math.floor(decimalHours);
        const m = Math.round((decimalHours - h) * 60);
        setHours(h.toString());
        setMinutes(m.toString().padStart(2, "0"));
      }
      // Empty or invalid value
      else {
        setHours("");
        setMinutes("");
      }
    } else {
      setHours("");
      setMinutes("");
    }
  }, [value]);

  const handleHoursChange = (text) => {
    // Allow only numbers
    const numericText = text.replace(/\D/g, "");

    if (numericText.length > 2) return; // Max 2 digits for hours

    // Validate hours range (0-24)
    const hoursValue = parseInt(numericText || "0", 10);
    if (hoursValue > 24) return;

    // Set typing flag to prevent useEffect from interfering
    isUserTypingRef.current = true;

    setHours(numericText);

    // Convert to decimal and send to parent
    const h = parseInt(numericText || "0", 10);
    const m = parseInt(minutes || "0", 10);
    const decimalHours = h + m / 60;

    // Always send the calculated decimal hours, including 0
    onChangeText(decimalHours.toString());

    // Clear typing flag after a short delay
    setTimeout(() => {
      isUserTypingRef.current = false;
    }, 100);
  };

  const handleMinutesChange = (text) => {
    // Allow only numbers
    const numericText = text.replace(/\D/g, "");

    if (numericText.length > 2) return; // Max 2 digits for minutes

    // Ensure minutes don't exceed 59
    const minutesValue = parseInt(numericText || "0", 10);
    if (minutesValue >= 60) return;

    // Set typing flag to prevent useEffect from interfering
    isUserTypingRef.current = true;

    // Don't auto-pad while user is typing - only show what they typed
    setMinutes(numericText);

    // Convert to decimal and send to parent
    const h = parseInt(hours || "0", 10);
    const m = parseInt(numericText || "0", 10);
    const decimalHours = h + m / 60;

    // Always send the calculated decimal hours, including 0
    onChangeText(decimalHours.toString());

    // Clear typing flag after a short delay
    setTimeout(() => {
      isUserTypingRef.current = false;
    }, 100);
  };

  const handleMinutesBlur = () => {
    // Format minutes with leading zero when user finishes editing
    if (minutes && minutes.length === 1) {
      const formattedMinutes = minutes.padStart(2, "0");
      setMinutes(formattedMinutes);
    } else if (!minutes) {
      setMinutes("");
    }
  };

  const styles = StyleSheet.create({
    container: {
      position: "relative",
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minHeight: 50,
    },
    hourInput: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
      textAlign: "center",
      fontFamily: "monospace",
      minWidth: 60,
    },
    separator: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginHorizontal: 8,
      fontFamily: "monospace",
    },
    minuteInput: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
      textAlign: "center",
      fontFamily: "monospace",
      minWidth: 60,
    },
    labels: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
      paddingHorizontal: 16,
    },
    label: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: "center",
      flex: 1,
      minWidth: 60,
    },
    separatorSpace: {
      flex: 1,
      minWidth: 16, // Same as separator marginHorizontal
    },
  });

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputRow}>
        <TextInput
          ref={hoursInputRef}
          style={styles.hourInput}
          value={hours}
          onChangeText={handleHoursChange}
          placeholder="0"
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="numeric"
          maxLength={2}
          returnKeyType="next"
          onSubmitEditing={() => minutesInputRef.current?.focus()}
          {...props}
        />
        <Text style={styles.separator}>:</Text>
        <TextInput
          ref={minutesInputRef}
          style={styles.minuteInput}
          value={minutes}
          onChangeText={handleMinutesChange}
          onBlur={handleMinutesBlur}
          placeholder="00"
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="numeric"
          maxLength={2}
          returnKeyType="done"
          {...props}
        />
      </View>

      <View style={styles.labels}>
        <Text style={styles.label}>Hours</Text>
        <View style={styles.separatorSpace} />
        <Text style={styles.label}>Minutes</Text>
      </View>
    </View>
  );
}
