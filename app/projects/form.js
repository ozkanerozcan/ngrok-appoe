import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from "react-native";
import { ActivityIndicator } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "../../src/contexts/ThemeContext";
import { projectService } from "../../src/services";
import { showToast } from "../../src/utils/toast";
import ProtectedRoute from "../../src/components/ProtectedRoute";

export default function ProjectFormScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const scrollViewRef = useRef(null);
  const titleInputRef = useRef(null);
  const descriptionInputRef = useRef(null);
  const [focusedInputRef, setFocusedInputRef] = useState(null);

  const scrollToInput = (inputRef) => {
    setFocusedInputRef(inputRef);
    // Wait for keyboard to fully show before measuring
    const keyboardListener = Keyboard.addListener("keyboardDidShow", () => {
      if (scrollViewRef.current && inputRef.current) {
        inputRef.current.measure((x, y, width, height, pageX, pageY) => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({
              y: pageY - 200, // Scroll to show input with more padding for keyboard
              animated: true,
            });
          }
        });
      }
      keyboardListener.remove();
    });
  };

  useEffect(() => {
    if (isEditing) {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    setLoading(true);
    try {
      const project = await projectService.getById(id);
      setFormData({
        title: project.title || "",
        description: project.description || "",
      });
    } catch (error) {
      console.error("Error loading project:", error);
      showToast("error", "Failed to load project");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      showToast("error", "Please enter a title");
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        await projectService.update(id, formData);
        showToast("success", "Project updated successfully");
      } else {
        await projectService.create(formData);
        showToast("success", "Project created successfully");
      }
      router.back();
    } catch (error) {
      console.error("Error saving project:", error);
      showToast("error", "Failed to save project");
    } finally {
      setSubmitting(false);
    }
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
    disabledButton: {
      opacity: 0.5,
    },
    content: {
      flex: 1,
      padding: 20,
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
    required: {
      color: theme.colors.error,
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
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      color: theme.colors.text,
      fontSize: 16,
    },
  });
  if (loading) {
    return (
      <ProtectedRoute>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.back()}
            >
              <Text style={styles.headerButtonText}>Cancel</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              {isEditing ? "Edit Project" : "Add Project"}
            </Text>

            <View style={styles.headerButton} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </View>
      </ProtectedRoute>
    );
  }
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

            <Text style={styles.headerTitle}>
              {isEditing ? "Edit Project" : "Add Project"}
            </Text>

            <TouchableOpacity
              style={[styles.headerButton, submitting && styles.disabledButton]}
              onPress={handleSave}
              disabled={submitting}
            >
              <Text style={styles.headerButtonText}>
                {submitting ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                ref={titleInputRef}
                style={styles.input}
                placeholder="Enter project title..."
                placeholderTextColor={theme.colors.textSecondary}
                value={formData.title}
                onChangeText={(text) =>
                  setFormData({ ...formData, title: text })
                }
                returnKeyType="next"
                blurOnSubmit={false}
                onFocus={() => scrollToInput(titleInputRef)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                ref={descriptionInputRef}
                style={[styles.input, styles.textArea]}
                placeholder="Enter project description..."
                placeholderTextColor={theme.colors.textSecondary}
                value={formData.description}
                onChangeText={(text) =>
                  setFormData({ ...formData, description: text })
                }
                multiline
                numberOfLines={4}
                returnKeyType="done"
                textAlignVertical="top"
                onFocus={() => scrollToInput(descriptionInputRef)}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ProtectedRoute>
  );
}
