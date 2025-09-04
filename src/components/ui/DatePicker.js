import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TextInput,
  Modal,
  ScrollView,
  Dimensions,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

export default function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  minimumDate,
  maximumDate,
  style,
  defaultToToday = false,
  ...props
}) {
  const { theme, isDark } = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  // Helper function to format date as DD/MM/YYYY
  const formatDateDDMMYYYY = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Set default to today's date if no value provided and defaultToToday is true
  const getDefaultDate = () => {
    if (value) return value;
    if (defaultToToday) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    return null;
  };

  const selectedDate = getDefaultDate() ? new Date(getDefaultDate()) : null;

  const handlePress = () => {
    if (selectedDate) {
      setTempDate(selectedDate);
    } else {
      setTempDate(new Date());
    }
    setShowPicker(true);
  };

  // Custom modal date picker for better theme support
  const CustomDatePicker = () => {
    const [currentDate, setCurrentDate] = useState(selectedDate || new Date());

    const handleCustomDateSelect = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;
      onChange(formattedDate);
      setShowPicker(false);
    };

    const generateCalendarDays = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());

      const days = [];
      const current = new Date(startDate);

      for (let i = 0; i < 42; i++) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }

      return days;
    };

    const isToday = (date) => {
      const today = new Date();
      return date.toDateString() === today.toDateString();
    };

    const isSelected = (date) => {
      return (
        selectedDate && date.toDateString() === selectedDate.toDateString()
      );
    };

    const isCurrentMonth = (date) => {
      return date.getMonth() === currentDate.getMonth();
    };

    const isDisabled = (date) => {
      if (minimumDate && date < minimumDate) return true;
      if (maximumDate && date > maximumDate) return true;
      return false;
    };

    const changeMonth = (direction) => {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + direction);
      setCurrentDate(newDate);
    };

    const modalStyles = StyleSheet.create({
      modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      },
      modalContent: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        width: "100%",
        maxWidth: 400,
        maxHeight: Dimensions.get("window").height * 0.8,
      },
      header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },
      headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: theme.colors.text,
      },
      closeButton: {
        padding: 4,
      },
      calendarHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
      },
      monthYear: {
        fontSize: 16,
        fontWeight: "600",
        color: theme.colors.text,
      },
      navButton: {
        padding: 8,
      },
      weekdays: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingBottom: 8,
      },
      weekday: {
        flex: 1,
        textAlign: "center",
        fontSize: 12,
        fontWeight: "600",
        color: theme.colors.textSecondary,
      },
      daysGrid: {
        paddingHorizontal: 16,
        paddingBottom: 16,
      },
      weekRow: {
        flexDirection: "row",
        marginBottom: 4,
      },
      dayCell: {
        flex: 1,
        aspectRatio: 1,
        justifyContent: "center",
        alignItems: "center",
        margin: 2,
        borderRadius: 8,
      },
      dayText: {
        fontSize: 14,
        color: theme.colors.text,
      },
      todayCell: {
        backgroundColor: theme.colors.primary + "20",
      },
      selectedCell: {
        backgroundColor: theme.colors.primary,
      },
      selectedText: {
        color: theme.colors.onPrimary,
        fontWeight: "600",
      },
      disabledText: {
        color: theme.colors.textSecondary,
      },
      otherMonthText: {
        color: theme.colors.textSecondary + "80",
      },
    });

    return (
      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContent}>
            <View style={modalStyles.header}>
              <Text style={modalStyles.headerTitle}>Select Date</Text>
              <TouchableOpacity
                style={modalStyles.closeButton}
                onPress={() => setShowPicker(false)}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={modalStyles.calendarHeader}>
              <TouchableOpacity
                style={modalStyles.navButton}
                onPress={() => changeMonth(-1)}
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={theme.colors.text}
                />
              </TouchableOpacity>

              <Text style={modalStyles.monthYear}>
                {currentDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </Text>

              <TouchableOpacity
                style={modalStyles.navButton}
                onPress={() => changeMonth(1)}
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
            </View>

            <View style={modalStyles.weekdays}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <Text key={day} style={modalStyles.weekday}>
                  {day}
                </Text>
              ))}
            </View>

            <ScrollView style={modalStyles.daysGrid}>
              {Array.from({ length: 6 }, (_, weekIndex) => (
                <View key={weekIndex} style={modalStyles.weekRow}>
                  {generateCalendarDays()
                    .slice(weekIndex * 7, (weekIndex + 1) * 7)
                    .map((date, dayIndex) => {
                      const today = isToday(date);
                      const selected = isSelected(date);
                      const currentMonth = isCurrentMonth(date);
                      const disabled = isDisabled(date);

                      return (
                        <TouchableOpacity
                          key={dayIndex}
                          style={[
                            modalStyles.dayCell,
                            today && modalStyles.todayCell,
                            selected && modalStyles.selectedCell,
                          ]}
                          onPress={() =>
                            !disabled && handleCustomDateSelect(date)
                          }
                          disabled={disabled}
                        >
                          <Text
                            style={[
                              modalStyles.dayText,
                              selected && modalStyles.selectedText,
                              disabled && modalStyles.disabledText,
                              !currentMonth && modalStyles.otherMonthText,
                            ]}
                          >
                            {date.getDate()}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const styles = StyleSheet.create({
    container: {
      position: "relative",
    },
    picker: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minHeight: 50,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    pickerText: {
      fontSize: 16,
      color: theme.colors.text,
      flex: 1,
    },
    placeholder: {
      color: theme.colors.textSecondary,
    },
    clearButton: {
      position: "absolute",
      right: 12,
      top: "50%",
      transform: [{ translateY: -12 }],
      padding: 4,
      zIndex: 10,
    },
  });

  // Unified implementation using custom modal for all platforms
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.picker, style]}
        onPress={handlePress}
        {...props}
      >
        <Text style={[styles.pickerText, !selectedDate && styles.placeholder]}>
          {selectedDate ? formatDateDDMMYYYY(selectedDate) : placeholder}
        </Text>
        <Ionicons
          name="calendar-outline"
          size={20}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>

      <CustomDatePicker />
    </View>
  );
}
