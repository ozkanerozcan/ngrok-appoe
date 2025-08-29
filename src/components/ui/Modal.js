import React, { useRef } from "react";
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

export default function Modal({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  animationType = "slide",
  ...props
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);

  const scrollToInput = (inputRef) => {
    if (scrollViewRef.current && inputRef.current) {
      setTimeout(() => {
        inputRef.current.measure((x, y, width, height, pageX, pageY) => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({
              y: pageY - 150, // Scroll to show input with some padding
              animated: true,
            });
          }
        });
      }, 100);
    }
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    container: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "90%",
      minHeight: "50%",
      paddingBottom: Math.max(insets.bottom, 20),
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: "600",
      color: theme.colors.text,
      flex: 1,
    },
    closeButton: {
      padding: 4,
      marginLeft: 16,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
    },
  });

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
      {...props}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <SafeAreaView style={styles.container} edges={["left", "right"]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              {showCloseButton && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>
            <ScrollView
              ref={scrollViewRef}
              style={styles.content}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              {children}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </RNModal>
  );
}
