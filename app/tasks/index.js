import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useTheme } from "../../src/contexts/ThemeContext";
import { taskService, timeLogService } from "../../src/services";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { formatDurationEnglish } from "../../src/utils/duration";
import ProtectedRoute from "../../src/components/ProtectedRoute";
import { Card, DeleteConfirmationModal } from "../../src/components/ui";

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

export default function TaskDetailsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { id } = params;
  const [task, setTask] = useState(null);
  const [timeLogs, setTimeLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
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
    description: {
      fontSize: 16,
      color: theme.colors.text,
      lineHeight: 24,
      marginBottom: 24,
    },
    metadataContainer: {
      marginTop: 0,
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
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 0,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      marginTop: 0,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.text,
    },
    totalTime: {
      fontSize: 16,
      color: theme.colors.primary,
      fontWeight: "600",
    },
    timeLogItem: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: 20,
      marginBottom: 12,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    timeLogTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 4,
    },
    timeLogDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 8,
      lineHeight: 20,
    },
    timeLogMeta: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    timeLogDuration: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: "600",
    },
    timeLogDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    emptyTimeLogsContainer: {
      alignItems: "center",
      paddingVertical: 40,
      paddingHorizontal: 0,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: "center",
    },
    emptyDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: "center",
      marginBottom: 24,
    },
    emptyButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    emptyButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 14,
      fontWeight: "600",
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
    durationBadge: {
      backgroundColor: theme.colors.primary + "20",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 8,
    },
    durationText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.primary,
    },
  });

  // Load task data
  useEffect(() => {
    if (id) {
      loadTaskData();
    }
  }, [id]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (id) {
        loadTaskData();
      }
    }, [id])
  );

  const loadTaskData = async () => {
    if (!id || id === "undefined" || id === "null") {
      console.error("Invalid task ID:", id);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Invalid task ID",
      });
      router.back();
      return;
    }

    setLoading(true);
    try {
      const [taskData, timeLogsData] = await Promise.all([
        taskService.getById(id),
        taskService.getTimeLogs(id),
      ]);
      setTask(taskData);
      setTimeLogs(
        timeLogsData.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )
      );
    } catch (error) {
      console.error("Error loading task data:", error);
      if (error.message === "Task not found") {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Task not found or access denied",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load task data",
        });
      }
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (!id) return;
    router.push(`/tasks/form?id=${id}`);
  };

  const handleAddTimeLog = () => {
    router.push(`/timelogs/form?taskId=${id}`);
  };

  const handleEditTimeLog = (timeLog) => {
    router.push(`/timelogs/form?id=${timeLog.id}`);
  };

  const handleDeleteTimeLog = (timeLog) => {
    setItemToDelete(timeLog);
    setDeleteModalVisible(true);
  };

  const handleConfirmDeleteTimeLog = async () => {
    if (!itemToDelete) return;

    setDeleting(true);
    try {
      await timeLogService.delete(itemToDelete.id);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Time log deleted successfully",
      });
      loadTaskData();
      setDeleteModalVisible(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting time log:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete time log",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDeleteTimeLog = () => {
    setDeleteModalVisible(false);
    setItemToDelete(null);
  };

  // Prepare data for FlatList
  const getFlatListData = () => {
    const data = [];

    // Show loading if fetching task data
    if (loading) {
      data.push({ type: "loading" });
      return data;
    }

    if (!task) {
      data.push({ type: "notFound" });
      return data;
    }

    // Main content
    if (task.title) data.push({ type: "title", content: task.title });
    if (task.description)
      data.push({ type: "description", content: task.description });

    // Metadata section
    if (
      task.created_by_profile ||
      task.created_at ||
      task.updated_by_profile ||
      task.updated_at ||
      task.projects ||
      task.activities ||
      task.modules ||
      task.deadline_at ||
      task.status
    ) {
      data.push({ type: "metadata" });
    }

    // Time logs section
    if (timeLogs.length > 0) {
      data.push({ type: "timeLogsHeader" });
      timeLogs.forEach((timeLog) => {
        data.push({ type: "timeLog", content: timeLog });
      });
    } else {
      data.push({ type: "emptyTimeLogs" });
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
      case "notFound":
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Task not found</Text>
          </View>
        );
      case "title":
        return <Text style={styles.title}>{item.content}</Text>;
      case "description":
        return <Text style={styles.description}>{item.content}</Text>;
      case "metadata":
        return (
          <View style={styles.metadataContainer}>
            {task.created_by_profile && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Created By:</Text>
                <Text style={styles.metadataValue}>
                  {typeof task.created_by_profile === "object"
                    ? task.created_by_profile.full_name ||
                      task.created_by_profile.id
                    : task.created_by_profile}
                </Text>
              </View>
            )}

            {task.created_at && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Created At:</Text>
                <Text style={styles.metadataValue}>
                  {formatDateDDMMYYYY(task.created_at)}
                </Text>
              </View>
            )}

            {task.updated_by_profile &&
              (typeof task.updated_by_profile === "object"
                ? task.updated_by_profile.full_name ||
                  task.updated_by_profile.id
                : task.updated_by_profile) !==
                (typeof task.created_by_profile === "object"
                  ? task.created_by_profile.full_name ||
                    task.created_by_profile.id
                  : task.created_by_profile) && (
                <View style={styles.metadataItem}>
                  <Text style={styles.metadataLabel}>Updated By:</Text>
                  <Text style={styles.metadataValue}>
                    {typeof task.updated_by_profile === "object"
                      ? task.updated_by_profile.full_name ||
                        task.updated_by_profile.id
                      : task.updated_by_profile}
                  </Text>
                </View>
              )}

            {task.updated_at &&
              new Date(task.updated_at).getTime() !==
                new Date(task.created_at).getTime() && (
                <View style={styles.metadataItem}>
                  <Text style={styles.metadataLabel}>Updated At:</Text>
                  <Text style={styles.metadataValue}>
                    {formatDateDDMMYYYY(task.updated_at)}
                  </Text>
                </View>
              )}

            {task.projects && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Project:</Text>
                <Text style={styles.metadataValueFlexible}>
                  {typeof task.projects === "object"
                    ? task.projects.title
                    : task.projects}
                </Text>
              </View>
            )}
            {task.modules && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Module:</Text>
                <Text style={styles.metadataValueFlexible}>
                  {typeof task.modules === "object"
                    ? task.modules.title
                    : task.modules}
                </Text>
              </View>
            )}
            {task.activities && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Activity:</Text>
                <Text style={styles.metadataValueFlexible}>
                  {typeof task.activities === "object"
                    ? task.activities.title
                    : task.activities}
                </Text>
              </View>
            )}

            {task.deadline_at && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Deadline:</Text>
                <Text style={styles.metadataValue}>
                  {formatDateDDMMYYYY(task.deadline_at)}
                </Text>
              </View>
            )}

            {task.status && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Status:</Text>
                <Text style={styles.metadataValue}>
                  {formatStatus(task.status)}
                </Text>
              </View>
            )}
          </View>
        );
      case "timeLogsHeader":
        const totalDuration = timeLogs.reduce(
          (sum, log) => sum + (log.duration || 0),
          0
        );
        return (
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: "column" }}>
              <Text style={styles.sectionTitle}>Time Logs</Text>
              <Text style={styles.totalTime}>
                Total: {formatDurationEnglish(totalDuration)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleAddTimeLog}
            >
              <Ionicons name="add" size={20} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          </View>
        );
      case "timeLog":
        const timeLog = item.content;
        return (
          <Card
            id={timeLog.id}
            description={timeLog.description || ""}
            created_at={timeLog.created_at}
            updated_at={timeLog.updated_at}
            duration={timeLog.duration}
            onEdit={() => handleEditTimeLog(timeLog)}
            onDelete={() => handleDeleteTimeLog(timeLog)}
            style={{
              marginHorizontal: 0,
              marginBottom: 12,
            }}
            rightContent={
              timeLog.duration ? (
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>
                    {formatDurationEnglish(timeLog.duration)}
                  </Text>
                </View>
              ) : null
            }
          />
        );
      case "emptyTimeLogs":
        return (
          <View style={styles.emptyTimeLogsContainer}>
            <Ionicons
              name="time-outline"
              size={48}
              color={theme.colors.textSecondary}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No Time Logs Yet</Text>
            <Text style={styles.emptyDescription}>
              Start tracking time for this task by creating your first time log
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleAddTimeLog}
            >
              <Text style={styles.emptyButtonText}>Add Time Log</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

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

          <Text style={styles.headerTitle}>Task Details</Text>

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

        <DeleteConfirmationModal
          visible={deleteModalVisible}
          onClose={handleCancelDeleteTimeLog}
          onConfirm={handleConfirmDeleteTimeLog}
          title="Delete Time Log"
          message="Are you sure you want to delete this time log?"
          itemType="time log"
          loading={deleting}
        />
      </SafeAreaView>
    </ProtectedRoute>
  );
}
