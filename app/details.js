import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useTheme } from "../src/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import ProtectedRoute from "../src/components/ProtectedRoute";
import { formatDurationEnglish } from "../src/utils/duration";
import { timeLogService } from "../src/services";
import { showToast } from "../src/utils/toast";

export default function DetailsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  // Helper function to format date as DD/MM/YYYY HH:mm
  const formatDateDDMMYYYY = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Helper function to format status
  const formatStatus = (status) => {
    if (!status) return "Unknown";
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // State for fetched time log data
  const [timeLogData, setTimeLogData] = useState(null);
  const [loadingTimeLog, setLoadingTimeLog] = useState(false);

  const {
    id,
    title: titleParam,
    subtitle: subtitleParam,
    description: descriptionParam,
    created_by: createdByParam,
    created_at: createdAtParam,
    updated_by: updatedByParam,
    updated_at: updatedAtParam,
    project: projectParam,
    location: locationParam,
    duration: durationParam,
    deadline_at: deadlineAtParam,
    status: statusParam,
    task: taskParam,
  } = params;

  // Determine if we need to fetch data (only ID provided) or use params
  const shouldFetchData = id && !titleParam && !descriptionParam;

  // Use fetched data or params
  const title = timeLogData?.title || titleParam;
  const subtitle = timeLogData?.subtitle || subtitleParam;
  const description = timeLogData?.description || descriptionParam;
  const created_at = timeLogData?.created_at || createdAtParam;
  const updated_at = timeLogData?.updated_at || updatedAtParam;
  const duration = timeLogData?.duration || durationParam;
  const deadline_at = timeLogData?.deadline_at || deadlineAtParam;
  const status = timeLogData?.status || statusParam;
  // Parse JSON strings back to objects or use fetched data
  const created_by =
    timeLogData?.created_by_profile ||
    (createdByParam ? JSON.parse(createdByParam) : null);

  const updated_by =
    timeLogData?.updated_by_profile ||
    (updatedByParam ? JSON.parse(updatedByParam) : null);
  const project =
    timeLogData?.projects || (projectParam ? JSON.parse(projectParam) : null);
  const location =
    timeLogData?.locations ||
    (locationParam ? JSON.parse(locationParam) : null);
  const task = timeLogData?.tasks || (taskParam ? JSON.parse(taskParam) : null);

  // Fetch time log data when component mounts
  useEffect(() => {
    if (id) {
      loadTimeLogData();
    }
  }, [id]);

  // Refresh data when screen comes into focus (e.g., after editing)
  useFocusEffect(
    useCallback(() => {
      if (id) {
        loadTimeLogData();
      }
    }, [id])
  );

  const loadTimeLogData = async () => {
    if (!id) return;

    setLoadingTimeLog(true);
    try {
      const data = await timeLogService.getById(id);
      setTimeLogData(data);
    } catch (error) {
      console.error("Error loading time log data:", error);
      if (error.message === "Time log not found") {
        showToast("error", "Time log not found or access denied");
      } else {
        showToast("error", "Failed to load time log data");
      }
    } finally {
      setLoadingTimeLog(false);
    }
  };

  const handleEdit = () => {
    if (!id) return;

    // Navigate to edit form with current time log data
    const editData = {
      id,
      title,
      subtitle,
      description,
      project: project ? JSON.stringify(project) : null,
      location: location ? JSON.stringify(location) : null,
      duration: duration ? duration.toString() : null,
      deadline_at,
      status,
      created_by: created_by ? JSON.stringify(created_by) : null,
      created_at,
      updated_by: updated_by ? JSON.stringify(updated_by) : null,
      updated_at,
    };

    // Convert data to URL parameters
    const params = new URLSearchParams();
    Object.keys(editData).forEach((key) => {
      if (editData[key] !== null && editData[key] !== undefined) {
        params.append(key, editData[key]);
      }
    });

    router.push(`/timelogs/form?${params.toString()}`);
  };

  // Prepare data for FlatList
  const getFlatListData = () => {
    const data = [];

    // Show loading if fetching time log data
    if (loadingTimeLog) {
      data.push({ type: "loading" });
      return data;
    }

    // Main content
    // Remove title display for time logs details page
    // if (title) data.push({ type: "title", content: title });
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
      duration ||
      deadline_at ||
      status ||
      task
    ) {
      data.push({ type: "metadata" });
    }

    return data;
  };

  const renderItem = ({ item }) => {
    switch (item.type) {
      case "loading":
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        );
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
                  {formatDateDDMMYYYY(created_at)}
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
                  {formatDateDDMMYYYY(updated_at)}
                </Text>
              </View>
            )}

            {project && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Project:</Text>
                <Text style={styles.metadataValueFlexible}>
                  {typeof project === "object" ? project.title : project}
                </Text>
              </View>
            )}

            {location && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Location:</Text>
                <Text style={styles.metadataValueFlexible}>
                  {typeof location === "object" ? location.title : location}
                </Text>
              </View>
            )}

            {task && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Task:</Text>
                <Text style={styles.metadataValueFlexible}>
                  {typeof task === "object" ? task.title : task}
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

            {deadline_at && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Deadline:</Text>
                <Text style={styles.metadataValue}>
                  {formatDateDDMMYYYY(deadline_at)}
                </Text>
              </View>
            )}

            {status && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Status:</Text>
                <Text style={styles.metadataValue}>{formatStatus(status)}</Text>
              </View>
            )}
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
      alignItems: "flex-start",
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
    metadataValueFlexible: {
      fontSize: 16,
      color: theme.colors.text,
      flex: 2,
      textAlign: "right",
      marginLeft: 16,
      lineHeight: 20,
      ...(Platform.OS === "web" && {
        wordWrap: "break-word",
        overflowWrap: "break-word",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }),
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
    },
    loadingText: {
      color: theme.colors.textSecondary,
      fontSize: 16,
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.primary + "20",
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      marginBottom: 16,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalContainer: {
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      width: "100%",
      maxWidth: 400,
      padding: 24,
      alignItems: "center",
    },
    message: {
      fontSize: 16,
      color: theme.colors.text,
      textAlign: "center",
      marginBottom: 8,
      lineHeight: 24,
    },
    buttonsContainer: {
      flexDirection: "row",
      width: "100%",
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
    },
    confirmButton: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
    },
    buttonText: {
      fontSize: 16,
      fontWeight: "600",
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

          <TouchableOpacity style={styles.headerButton} onPress={handleEdit}>
            <Ionicons name="pencil" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
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
