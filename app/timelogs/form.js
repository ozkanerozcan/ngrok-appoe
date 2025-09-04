import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  FlatList,
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
import {
  timeLogService,
  locationService,
  taskService,
} from "../../src/services";
import { showToast } from "../../src/utils/toast";
import ProtectedRoute from "../../src/components/ProtectedRoute";
import { Ionicons } from "@expo/vector-icons";
import { DurationInput, DatePicker } from "../../src/components/ui";

export default function TimeLogFormScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { id, isArchiveEdit, originalTimeLogId, taskId } = params;
  const isEditing = !!id;
  const isEditingArchive = !!isArchiveEdit;

  const [formData, setFormData] = useState({
    description: "",
    location: "",
    duration: "",
    task: "",
  });
  const [locations, setLocations] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const scrollViewRef = useRef(null);
  const titleInputRef = useRef(null);
  const durationInputRef = useRef(null);
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
    loadData();
  }, []);

  useEffect(() => {
    if (isEditing) {
      loadTimeLog();
    } else {
      // For new time logs, pre-select task if provided
      setFormData((prev) => ({
        ...prev,
        task: taskId || "",
      }));
    }
  }, [id, isEditing, taskId]);

  const loadData = async () => {
    try {
      const [locationsData, tasksData] = await Promise.all([
        locationService.getAll(),
        taskService.getAll(),
      ]);
      setLocations(locationsData);
      setTasks(tasksData);
    } catch (error) {
      console.error("Error loading data:", error);
      showToast("error", "Failed to load data");
    }
  };

  const loadTimeLog = async () => {
    setLoading(true);
    try {
      let data;
      if (isEditingArchive) {
        // Load archive data for editing
        const archives = await timeLogService.getArchivedLogs(
          originalTimeLogId
        );
        const archiveToEdit = archives.find((archive) => archive.id === id);
        if (!archiveToEdit) {
          throw new Error("Archive not found");
        }
        data = archiveToEdit;
      } else {
        // Load regular time log data
        data = await timeLogService.getById(id);
      }

      setFormData({
        description: data.description || "",
        location: data.location || "",
        duration: data.duration || "",
        task: data.task || "",
      });
    } catch (error) {
      console.error("Error loading data:", error);
      showToast("error", "Failed to load data");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    console.log("handleSave called with formData:", formData);

    if (!formData.location) {
      showToast("error", "Please select a location");
      return;
    }

    if (!formData.duration) {
      showToast("error", "Please enter duration");
      return;
    }

    // Handle duration parsing more robustly
    let duration = 0;
    if (typeof formData.duration === "string") {
      duration = parseFloat(formData.duration);
    } else if (typeof formData.duration === "number") {
      duration = formData.duration;
    } else {
      showToast("error", "Invalid duration format");
      return;
    }

    if (isNaN(duration) || duration < 0) {
      showToast("error", "Duration must be a non-negative number");
      return;
    }

    console.log("Submitting with duration:", duration);

    const submitData = {
      description: formData.description || "",
      location: formData.location || null,
      duration: duration,
      task: formData.task || null,
    };

    console.log("Submit data:", submitData);

    // Save directly without archive confirmation
    await performSave(submitData, false, isEditingArchive);
  };

  const performSave = async (submitData) => {
    setSubmitting(true);
    try {
      if (isEditing) {
        if (isEditingArchive) {
          // Update archive record
          await timeLogService.updateArchive(id, submitData);
          showToast("success", "Archive updated successfully");
        } else {
          // Update regular time log
          await timeLogService.update(id, submitData);
          showToast("success", "Time log updated successfully");
        }
      } else {
        await timeLogService.create(submitData);
        showToast("success", "Time log created successfully");
      }
      router.back();
    } catch (error) {
      console.error("Error saving data:", error);

      if (
        error.message?.includes("relation") &&
        error.message?.includes("does not exist")
      ) {
        showToast(
          "error",
          "Database table not found. Please check your Supabase setup."
        );
      } else {
        showToast("error", error.message || "Failed to save data");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getSelectedLocation = () => {
    return locations.find((l) => l.id === formData.location);
  };

  const getSelectedTask = () => {
    return tasks.find((t) => t.id === formData.task);
  };

  const getTaskDisplayName = (task) => {
    if (!task) return "";
    return task.title;
  };

  const getFilteredLocations = () => {
    if (!locationSearch.trim()) {
      return locations;
    }
    return locations.filter((location) =>
      location.title.toLowerCase().includes(locationSearch.toLowerCase())
    );
  };

  const getFilteredTasks = () => {
    if (!taskSearch.trim()) {
      return tasks;
    }
    const searchLower = taskSearch.toLowerCase();
    return tasks.filter((task) => {
      const taskTitle = task.title.toLowerCase();
      return taskTitle.includes(searchLower);
    });
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
    truncatedInput: {
      ...(Platform.OS === "web" && {
        textOverflow: "ellipsis",
        overflow: "hidden",
        whiteSpace: "nowrap",
        maxWidth: "100%",
      }),
    },
    descriptionInput: {
      minHeight: Platform.OS === "web" ? 80 : 70,
      maxHeight: Platform.OS === "web" ? 120 : undefined,
      textAlignVertical: "top",
      ...(Platform.OS === "web" && {
        wordWrap: "break-word",
        overflowWrap: "break-word",
        whiteSpace: "pre-wrap",
      }),
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
      ...(Platform.OS === "web" && {
        textOverflow: "ellipsis",
        overflow: "hidden",
        whiteSpace: "nowrap",
      }),
    },
    pickerPlaceholder: {
      color: theme.colors.textSecondary,
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
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      width: "90%",
      maxHeight: "80%",
      padding: 20,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.text,
    },
    closeButton: {
      padding: 4,
      marginRight: 8,
    },
    listContainer: {
      maxHeight: 300,
    },
    item: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    itemText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    selectedItem: {
      backgroundColor: theme.colors.primary + "20",
    },
    selectedItemText: {
      color: theme.colors.primary,
      fontWeight: "600",
    },
    emptyContainer: {
      padding: 20,
      alignItems: "center",
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    searchInput: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 12,
      fontSize: 16,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 16,
      ...(Platform.OS === "web" && {
        textOverflow: "ellipsis",
        overflow: "hidden",
        whiteSpace: "nowrap",
        maxWidth: "100%",
      }),
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 16,
    },
    searchIcon: {
      marginRight: 8,
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
    clearTextButton: {
      backgroundColor: "#EF444420", // Red background with transparency
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      marginRight: 8,
      borderWidth: 1,
      borderColor: "#EF4444",
      justifyContent: "center",
      alignItems: "center",
    },
    clearTextButtonText: {
      color: "#DC2626", // Darker red text
      fontSize: 12,
      fontWeight: "600",
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
              {isEditing
                ? isEditingArchive
                  ? "Edit Archive"
                  : "Edit Time Log"
                : "Add Time Log"}
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
  const selectedLocation = getSelectedLocation();
  const selectedTask = getSelectedTask();

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
              {isEditing ? "Edit Time Log" : "Add Time Log"}
            </Text>

            <TouchableOpacity
              style={[styles.headerButton, submitting && styles.disabledButton]}
              onPress={() => {
                console.log("Save button pressed");
                handleSave();
              }}
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
                Location <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setLocationModalVisible(true)}
              >
                <Text
                  style={[
                    styles.pickerText,
                    !selectedLocation && styles.pickerPlaceholder,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {selectedLocation
                    ? selectedLocation.title
                    : "Select a location"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Task (Optional)</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setTaskModalVisible(true)}
              >
                <Text
                  style={[
                    styles.pickerText,
                    !selectedTask && styles.pickerPlaceholder,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {selectedTask
                    ? getTaskDisplayName(selectedTask)
                    : "Select a task"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Duration <Text style={styles.required}>*</Text>
              </Text>
              <DurationInput
                value={formData.duration}
                onChangeText={(text) =>
                  setFormData({ ...formData, duration: text })
                }
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                ref={descriptionInputRef}
                style={[styles.input, styles.descriptionInput]}
                placeholder="Enter time log description..."
                placeholderTextColor={theme.colors.textSecondary}
                value={formData.description}
                onChangeText={(text) =>
                  setFormData({ ...formData, description: text })
                }
                multiline
                numberOfLines={Platform.OS === "web" ? undefined : 3}
                returnKeyType="done"
                textAlignVertical="top"
                onFocus={() => scrollToInput(descriptionInputRef)}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Location Selection Modal */}
        <Modal
          visible={locationModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setLocationModalVisible(false);
            setLocationSearch("");
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Location</Text>
                <View style={{ flexDirection: "row" }}>
                  {formData.location && (
                    <TouchableOpacity
                      style={styles.clearTextButton}
                      onPress={() => {
                        setFormData({ ...formData, location: "" });
                        setLocationSearch("");
                        setLocationModalVisible(false);
                      }}
                    >
                      <Text style={styles.clearTextButtonText}>Clear</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => {
                      setLocationModalVisible(false);
                      setLocationSearch("");
                    }}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TextInput
                style={styles.searchInput}
                placeholder="Search locations..."
                placeholderTextColor={theme.colors.textSecondary}
                value={locationSearch}
                onChangeText={setLocationSearch}
                autoCapitalize="none"
                autoCorrect={false}
                ellipsizeMode="tail"
              />

              <View style={styles.listContainer}>
                {getFilteredLocations().length > 0 ? (
                  <FlatList
                    data={getFilteredLocations()}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                      const isSelected = item.id === formData.location;
                      return (
                        <TouchableOpacity
                          style={[
                            styles.item,
                            isSelected && styles.selectedItem,
                          ]}
                          onPress={() => {
                            setFormData({ ...formData, location: item.id });
                            setLocationModalVisible(false);
                            setLocationSearch("");
                          }}
                        >
                          <Text
                            style={[
                              styles.itemText,
                              isSelected && styles.selectedItemText,
                            ]}
                          >
                            {item.title}
                          </Text>
                        </TouchableOpacity>
                      );
                    }}
                    showsVerticalScrollIndicator={false}
                  />
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      {locationSearch.trim()
                        ? "No locations found matching your search"
                        : "No locations available"}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Modal>

        {/* Task Selection Modal */}
        <Modal
          visible={taskModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setTaskModalVisible(false);
            setTaskSearch("");
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Task</Text>
                <View style={{ flexDirection: "row" }}>
                  {formData.task && (
                    <TouchableOpacity
                      style={styles.clearTextButton}
                      onPress={() => {
                        setFormData({ ...formData, task: "" });
                        setTaskSearch("");
                        setTaskModalVisible(false);
                      }}
                    >
                      <Text style={styles.clearTextButtonText}>Clear</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => {
                      setTaskModalVisible(false);
                      setTaskSearch("");
                    }}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TextInput
                style={styles.searchInput}
                placeholder="Search tasks..."
                placeholderTextColor={theme.colors.textSecondary}
                value={taskSearch}
                onChangeText={setTaskSearch}
                autoCapitalize="none"
                autoCorrect={false}
                ellipsizeMode="tail"
              />

              <View style={styles.listContainer}>
                {getFilteredTasks().length > 0 ? (
                  <FlatList
                    data={getFilteredTasks()}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                      const isSelected = item.id === formData.task;
                      // Display only task title
                      const displayName = item.title;

                      return (
                        <TouchableOpacity
                          style={[
                            styles.item,
                            isSelected && styles.selectedItem,
                          ]}
                          onPress={() => {
                            setFormData({ ...formData, task: item.id });
                            setTaskModalVisible(false);
                            setTaskSearch("");
                          }}
                        >
                          <Text
                            style={[
                              styles.itemText,
                              isSelected && styles.selectedItemText,
                            ]}
                          >
                            {displayName}
                          </Text>
                        </TouchableOpacity>
                      );
                    }}
                    showsVerticalScrollIndicator={false}
                  />
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      {taskSearch.trim()
                        ? "No tasks found matching your search"
                        : "No tasks available"}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ProtectedRoute>
  );
}
