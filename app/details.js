import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "../src/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import ProtectedRoute from "../src/components/ProtectedRoute";
import { formatDurationEnglish } from "../src/utils/duration";
import { timeLogService } from "../src/services";

export default function DetailsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [archivedLogs, setArchivedLogs] = useState([]);
  const [loadingArchives, setLoadingArchives] = useState(false);

  const {
    id,
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

  // Fetch archived logs when component mounts
  useEffect(() => {
    if (id) {
      loadArchivedLogs();
    }
  }, [id]);

  const loadArchivedLogs = async () => {
    if (!id) return;

    setLoadingArchives(true);
    try {
      const archives = await timeLogService.getArchivedLogs(id);
      setArchivedLogs(archives);
    } catch (error) {
      console.error("Error loading archived logs:", error);
      // Don't show error toast for missing archive table, just silently fail
    } finally {
      setLoadingArchives(false);
    }
  };

  // Prepare data for FlatList
  const getFlatListData = () => {
    const data = [];

    // Main content
    if (title) data.push({ type: "title", content: title });
    if (subtitle) data.push({ type: "subtitle", content: subtitle });
    if (description) data.push({ type: "description", content: description });

    // Metadata section
    if (
      created_by ||
      created_at ||
      updated_by ||
      updated_at ||
      project ||
      location ||
      duration
    ) {
      data.push({ type: "metadata" });
    }

    // Archive section
    if (id) {
      data.push({ type: "archive-header" });

      if (loadingArchives) {
        data.push({ type: "archive-loading" });
      } else if (archivedLogs.length > 0) {
        archivedLogs.forEach((item) => {
          data.push({ type: "archive-item", ...item });
        });
      } else {
        data.push({ type: "archive-empty" });
      }
    }

    return data;
  };

  const renderItem = ({ item }) => {
    switch (item.type) {
      case "title":
        return <Text style={styles.title}>{item.content}</Text>;
      case "subtitle":
        return <Text style={styles.subtitle}>{item.content}</Text>;
      case "description":
        return <Text style={styles.description}>{item.content}</Text>;
      case "metadata":
        return (
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
              (typeof updated_by === "object" ? updated_by.id : updated_by) !==
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
        );
      case "archive-header":
        return (
          <View style={styles.archiveSection}>
            <Text style={styles.archiveTitle}>Archive History</Text>
          </View>
        );
      case "archive-loading":
        return (
          <View style={styles.archiveSection}>
            <Text style={styles.archiveEmpty}>Loading archive history...</Text>
          </View>
        );
      case "archive-empty":
        return (
          <View style={styles.archiveSection}>
            <Text style={styles.archiveEmpty}>
              No archived versions found for this time log.
            </Text>
          </View>
        );
      case "archive-item":
        return (
          <View style={styles.archiveItem}>
            <View style={styles.archiveItemHeader}>
              <Text style={styles.archiveItemTitle} numberOfLines={1}>
                {item.title || "Untitled"}
              </Text>
              <Text style={styles.archiveItemDate}>
                {item.created_at
                  ? new Date(item.created_at).toLocaleString()
                  : "Unknown"}
              </Text>
            </View>
            {item.description && (
              <Text style={styles.archiveItemContent} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <View style={styles.archiveItemDetails}>
              <View style={styles.archiveItemDetailRow}>
                <Text style={styles.archiveItemDetailLabel}>Duration:</Text>
                <Text style={styles.archiveItemDetailValue}>
                  {formatDurationEnglish(item.duration || 0)}
                </Text>
              </View>
              {item.projects && (
                <View style={styles.archiveItemDetailRow}>
                  <Text style={styles.archiveItemDetailLabel}>Project:</Text>
                  <Text
                    style={styles.archiveItemDetailValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {typeof item.projects === "object"
                      ? item.projects.title
                      : item.projects}
                  </Text>
                </View>
              )}
              {item.locations && (
                <View style={styles.archiveItemDetailRow}>
                  <Text style={styles.archiveItemDetailLabel}>Location:</Text>
                  <Text
                    style={styles.archiveItemDetailValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {typeof item.locations === "object"
                      ? item.locations.title
                      : item.locations}
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      default:
        return null;
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
    archiveSection: {
      marginTop: 32,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    archiveTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 16,
    },
    archiveItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    archiveItemHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    archiveItemTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
      flex: 1,
    },
    archiveItemDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    archiveItemContent: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    archiveItemDetails: {
      marginTop: 8,
    },
    archiveItemDetailRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    archiveItemDetailLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.textSecondary,
      minWidth: 60,
      marginRight: 8,
    },
    archiveItemDetailValue: {
      fontSize: 12,
      color: theme.colors.text,
      flex: 1,
    },
    archiveEmpty: {
      textAlign: "center",
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontStyle: "italic",
      marginTop: 8,
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

        <FlatList
          style={styles.content}
          data={getFlatListData()}
          keyExtractor={(item, index) => `${item.type}-${index}`}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        />
      </SafeAreaView>
    </ProtectedRoute>
  );
}
