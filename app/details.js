import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Platform,
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

  const [archivedLogs, setArchivedLogs] = useState([]);
  const [loadingArchives, setLoadingArchives] = useState(false);
  const [deleteArchiveModalVisible, setDeleteArchiveModalVisible] =
    useState(false);
  const [archiveToDelete, setArchiveToDelete] = useState(null);
  const [deletingArchive, setDeletingArchive] = useState(false);
  const [markDoneModalVisible, setMarkDoneModalVisible] = useState(false);
  const [markingDone, setMarkingDone] = useState(false);

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
    deadline_at,
  } = params;

  // Parse JSON strings back to objects
  const created_by = createdByParam ? JSON.parse(createdByParam) : null;
  const updated_by = updatedByParam ? JSON.parse(updatedByParam) : null;
  const project = projectParam ? JSON.parse(projectParam) : null;
  const location = locationParam ? JSON.parse(locationParam) : null;

  // Fetch archived logs when component mounts or when returning to screen
  useEffect(() => {
    if (id) {
      loadArchivedLogs();
    }
  }, [id]);

  // Refresh archive data when screen comes into focus (e.g., after editing)
  useFocusEffect(
    useCallback(() => {
      if (id) {
        loadArchivedLogs();
      }
    }, [id])
  );

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

  const handleEditArchive = (archiveItem) => {
    // Navigate to form with archive data for editing
    const archiveData = {
      ...archiveItem,
      isArchiveEdit: true,
      originalTimeLogId: archiveItem.original_time_log,
    };

    // Convert archive data to URL parameters
    const params = new URLSearchParams();
    Object.keys(archiveData).forEach((key) => {
      if (archiveData[key] !== null && archiveData[key] !== undefined) {
        params.append(
          key,
          typeof archiveData[key] === "object"
            ? JSON.stringify(archiveData[key])
            : archiveData[key].toString()
        );
      }
    });

    router.push(`/timelogs/form?${params.toString()}`);
  };

  const handleDeleteArchive = (archiveItem) => {
    setArchiveToDelete(archiveItem);
    setDeleteArchiveModalVisible(true);
  };

  const handleConfirmDeleteArchive = async () => {
    if (!archiveToDelete) return;

    setDeletingArchive(true);
    try {
      // Note: We'll need to add deleteArchive function to the service
      await timeLogService.deleteArchive(archiveToDelete.id);
      // Refresh the archived logs
      await loadArchivedLogs();
      setDeleteArchiveModalVisible(false);
      setArchiveToDelete(null);
    } catch (error) {
      console.error("Error deleting archive:", error);
      // Handle error (could add toast notification)
    } finally {
      setDeletingArchive(false);
    }
  };

  const handleCancelDeleteArchive = () => {
    setDeleteArchiveModalVisible(false);
    setArchiveToDelete(null);
  };

  const handleMarkDone = () => {
    setMarkDoneModalVisible(true);
  };

  const handleConfirmMarkDone = async () => {
    if (!id) return;

    setMarkingDone(true);
    try {
      // Mark the time log as done (status = "done")
      await timeLogService.updateStatus(id, "done");
      showToast("success", "Time log marked as done!");
      setMarkDoneModalVisible(false);
      // Navigate back to the time logs list
      router.back();
    } catch (error) {
      console.error("Error updating time log status:", error);
      showToast("error", "Failed to update time log status");
    } finally {
      setMarkingDone(false);
    }
  };

  const handleCancelMarkDone = () => {
    setMarkDoneModalVisible(false);
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
      duration ||
      deadline_at
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
              <Text style={styles.archiveItemDate}>
                {item.created_at
                  ? formatDateDDMMYYYY(item.created_at)
                  : "Unknown"}
              </Text>
              <View style={styles.archiveItemActions}>
                <TouchableOpacity
                  style={styles.archiveActionButton}
                  onPress={() => handleEditArchive(item)}
                >
                  <Ionicons
                    name="pencil"
                    size={16}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.archiveActionButton}
                  onPress={() => handleDeleteArchive(item)}
                >
                  <Ionicons name="trash" size={16} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.archiveItemDetails}>
              <Text
                style={styles.archiveItemTitle}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.title || "Untitled"}
              </Text>
              {item.description && (
                <Text
                  style={styles.archiveItemDescription}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {item.description}
                </Text>
              )}
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
              {item.deadline_at && (
                <View style={styles.archiveItemDetailRow}>
                  <Text style={styles.archiveItemDetailLabel}>Deadline:</Text>
                  <Text style={styles.archiveItemDetailValue}>
                    {formatDateDDMMYYYY(item.deadline_at)}
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
      fontSize: 14,
      fontWeight: "bold",
      color: theme.colors.text,
    },
    archiveItemTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.colors.text,
      marginBottom: 4,
    },
    archiveItemDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 8,
      lineHeight: 20,
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
    archiveItemActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    archiveActionButton: {
      padding: 6,
      borderRadius: 6,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
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

          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleMarkDone}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={20}
              color={theme.colors.primary}
            />
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

        {/* Mark as Done Confirmation Modal */}
        <Modal
          visible={markDoneModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMarkDoneModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { maxWidth: 400 }]}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={32}
                  color={theme.colors.primary}
                />
              </View>

              <Text style={styles.message}>Mark this time log as done?</Text>

              <Text
                style={[
                  styles.message,
                  {
                    fontSize: 14,
                    color: theme.colors.textSecondary,
                    marginBottom: 24,
                  },
                ]}
              >
                This will mark the time log as completed and update its status.
              </Text>

              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={[styles.cancelButton, { flex: 1, marginRight: 6 }]}
                  onPress={handleCancelMarkDone}
                  disabled={markingDone}
                >
                  <Text
                    style={[styles.buttonText, { color: theme.colors.text }]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmButton, { flex: 1, marginLeft: 6 }]}
                  onPress={handleConfirmMarkDone}
                  disabled={markingDone}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      { color: theme.colors.onPrimary },
                    ]}
                  >
                    {markingDone ? "Updating..." : "Mark as Done"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Archive Confirmation Modal */}
        <Modal
          visible={deleteArchiveModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDeleteArchiveModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { maxWidth: 400 }]}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name="trash-outline"
                  size={32}
                  color={theme.colors.error}
                />
              </View>

              <Text style={styles.message}>Delete this archived version?</Text>

              <Text
                style={[
                  styles.message,
                  {
                    fontSize: 14,
                    color: theme.colors.textSecondary,
                    marginBottom: 24,
                  },
                ]}
              >
                This will permanently remove this archived version. This action
                cannot be undone.
              </Text>

              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={[styles.cancelButton, { flex: 1, marginRight: 6 }]}
                  onPress={handleCancelDeleteArchive}
                  disabled={deletingArchive}
                >
                  <Text
                    style={[styles.buttonText, { color: theme.colors.text }]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmButton, { flex: 1, marginLeft: 6 }]}
                  onPress={handleConfirmDeleteArchive}
                  disabled={deletingArchive}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      { color: theme.colors.onPrimary },
                    ]}
                  >
                    {deletingArchive ? "Deleting..." : "Delete"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ProtectedRoute>
  );
}
