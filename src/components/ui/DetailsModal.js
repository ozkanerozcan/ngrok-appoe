import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import ProtectedRoute from "../ProtectedRoute";
import { formatDurationEnglish } from "../../utils/duration";

export default function DetailsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const {
    title,
    subtitle,
    description,
    created_by: createdByParam,
    created_at,
    updated_by: updatedByParam,
    updated_at,
    project: projectParam,
    location: locationParam,
    duration,
  } = params;

  // Parse JSON strings back to objects
  const created_by = createdByParam ? JSON.parse(createdByParam) : null;
  const updated_by = updatedByParam ? JSON.parse(updatedByParam) : null;
  const project = projectParam ? JSON.parse(projectParam) : null;
  const location = locationParam ? JSON.parse(locationParam) : null;

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
      flexGrow: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 18,
      color: theme.colors.textSecondary,
      marginBottom: 16,
    },
    description: {
      fontSize: 16,
      color: theme.colors.text,
      lineHeight: 24,
      marginBottom: 24,
    },
    metadataContainer: {
      marginTop: 20,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    metadataItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      paddingVertical: 8,
    },
    metadataLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.textSecondary,
      flex: 1,
    },
    metadataValue: {
      fontSize: 16,
      color: theme.colors.text,
      flex: 2,
      textAlign: "right",
      marginLeft: 16,
    },
  });

  return (
    <ProtectedRoute>
      <SafeAreaView
        style={styles.container}
        edges={["left", "right", "bottom"]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Text style={styles.headerButtonText}>Close</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Details</Text>

          <View style={styles.headerButton} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          {description && <Text style={styles.description}>{description}</Text>}

          {(created_by ||
            created_at ||
            updated_by ||
            updated_at ||
            project ||
            location ||
            duration) && (
            <View style={styles.metadataContainer}>
              {created_by && (
                <View style={styles.metadataItem}>
                  <Text style={styles.metadataLabel}>Created By:</Text>
                  <Text style={styles.metadataValue}>
                    {typeof created_by === "object"
                      ? created_by.full_name || created_by.id
                      : created_by}
                  </Text>
                </View>
              )}

              {created_at && (
                <View style={styles.metadataItem}>
                  <Text style={styles.metadataLabel}>Created At:</Text>
                  <Text style={styles.metadataValue}>
                    {new Date(created_at).toLocaleString()}
                  </Text>
                </View>
              )}

              {updated_by &&
                (typeof updated_by === "object"
                  ? updated_by.id
                  : updated_by) !==
                  (typeof created_by === "object"
                    ? created_by.id
                    : created_by) && (
                  <View style={styles.metadataItem}>
                    <Text style={styles.metadataLabel}>Updated By:</Text>
                    <Text style={styles.metadataValue}>
                      {typeof updated_by === "object"
                        ? updated_by.full_name || updated_by.id
                        : updated_by}
                    </Text>
                  </View>
                )}

              {updated_at && updated_at !== created_at && (
                <View style={styles.metadataItem}>
                  <Text style={styles.metadataLabel}>Updated At:</Text>
                  <Text style={styles.metadataValue}>
                    {new Date(updated_at).toLocaleString()}
                  </Text>
                </View>
              )}

              {project && (
                <View style={styles.metadataItem}>
                  <Text style={styles.metadataLabel}>Project:</Text>
                  <Text style={styles.metadataValue}>
                    {typeof project === "object" ? project.title : project}
                  </Text>
                </View>
              )}

              {location && (
                <View style={styles.metadataItem}>
                  <Text style={styles.metadataLabel}>Location:</Text>
                  <Text style={styles.metadataValue}>
                    {typeof location === "object" ? location.title : location}
                  </Text>
                </View>
              )}

              {duration && (
                <View style={styles.metadataItem}>
                  <Text style={styles.metadataLabel}>Duration:</Text>
                  <Text style={styles.metadataValue}>
                    {formatDurationEnglish(parseFloat(duration))}
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ProtectedRoute>
  );
}
