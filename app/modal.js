import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "../src/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { showToast } from "../src/utils/toast";
import ProtectedRoute from "../src/components/ProtectedRoute";

export default function ModalScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSave = () => {
    if (!title.trim()) {
      showToast("error", "Please enter a title");
      return;
    }

    showToast("success", "Item saved successfully!");
    router.back();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      paddingTop: Math.max(insets.top, 16),
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.text,
    },
    headerButton: {
      padding: 8,
    },
    headerButtonText: {
      fontSize: 16,
      color: theme.colors.primary,
      fontWeight: "600",
    },
    content: {
      flex: 1,
      padding: 20,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 8,
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
    },
    textArea: {
      minHeight: 120,
      textAlignVertical: "top",
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      marginTop: 20,
    },
    saveButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: "600",
    },
    exampleSection: {
      marginTop: 30,
      padding: 20,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    exampleTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 12,
    },
    exampleText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
  });

  return (
    <ProtectedRoute>
      <SafeAreaView
        style={styles.container}
        edges={["left", "right", "bottom"]}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.back()}
            >
              <Text style={styles.headerButtonText}>Cancel</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Add New Item</Text>

            <TouchableOpacity style={styles.headerButton} onPress={handleSave}>
              <Text style={styles.headerButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter title..."
                placeholderTextColor={theme.colors.textSecondary}
                value={title}
                onChangeText={setTitle}
                returnKeyType="next"
                blurOnSubmit={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter description..."
                placeholderTextColor={theme.colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                returnKeyType="done"
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Item</Text>
            </TouchableOpacity>

            <View style={styles.exampleSection}>
              <Text style={styles.exampleTitle}>Modal Example</Text>
              <Text style={styles.exampleText}>
                This is an example of a modal screen in the React Native Expo
                application. Modals are great for creating focused user
                experiences like forms, settings panels, or detailed views. This
                modal demonstrates proper navigation, form handling, and
                responsive design that works on both mobile and web platforms.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ProtectedRoute>
  );
}
