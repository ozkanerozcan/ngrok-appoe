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
  projectService,
  locationService,
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
  const { id, isArchiveEdit, originalTimeLogId } = params;
  const isEditing = !!id;
  const isEditingArchive = !!isArchiveEdit;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project: "",
    location: "",
    duration: "",
    deadline_at: null,
  });
  const [projects, setProjects] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [archiveModalVisible, setArchiveModalVisible] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
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
    }
  }, [id]);

  const loadData = async () => {
    try {
      const [projectsData, locationsData] = await Promise.all([
        projectService.getAll(),
        locationService.getAll(),
      ]);
      setProjects(projectsData);
      setLocations(locationsData);
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
        title: data.title || "",
        description: data.description || "",
        project: data.project || "",
        location: data.location || "",
        duration: data.duration || "",
        deadline_at: data.deadline_at || null,
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

    if (!formData.title.trim()) {
      showToast("error", "Please enter a title");
      return;
    }

    if (!formData.project) {
      showToast("error", "Please select a project");
      return;
    }

    if (!formData.deadline_at) {
      showToast("error", "Please enter a deadline");
      return;
    }

    if (isEditing) {
      // Edit mode: keep all validations
      if (!formData.location) {
        showToast("error", "Please select a location");
        return;
      }

      if (!formData.duration) {
        showToast("error", "Please enter duration");
        return;
      }
    }

    // Handle duration parsing more robustly (only for edit mode)
    let duration = 0;
    if (isEditing) {
      if (typeof formData.duration === "string") {
        duration = parseFloat(formData.duration);
      } else if (typeof formData.duration === "number") {
        duration = formData.duration;
      } else {
        showToast("error", "Invalid duration format");
        return;
      }

      if (isNaN(duration) || duration <= 0) {
        showToast("error", "Duration must be a positive number");
        return;
      }
    }

    console.log("Submitting with duration:", duration);

    const submitData = {
      title: formData.title.trim(),
      description: formData.description || "",
      project: formData.project,
      location: isEditing ? formData.location : null,
      duration: isEditing ? duration : 0,
      deadline_at: formData.deadline_at,
    };

    console.log("Submit data:", submitData);

    if (isEditing) {
      if (isEditingArchive) {
        // Edit archive directly without confirmation
        await performSave(submitData, false, true);
      } else {
        // Show archive confirmation modal for editing regular time log
        setArchiveModalVisible(true);
      }
    } else {
      // Create new time log directly
      await performSave(submitData, false);
    }
  };

  const performSave = async (
    submitData,
    shouldArchive = false,
    isArchiveEdit = false
  ) => {
    setSubmitting(true);
    try {
      if (isEditing) {
        if (isArchiveEdit) {
          // Update archive record
          await timeLogService.updateArchive(id, submitData);
          showToast("success", "Archive updated successfully");
        } else {
          // Update regular time log
          await timeLogService.update(id, submitData, shouldArchive);
          showToast(
            "success",
            shouldArchive
              ? "Time log archived and updated successfully"
              : "Time log updated successfully"
          );
        }
      } else {
        await timeLogService.create(submitData);
        showToast("success", "Time log created successfully");
      }
      router.back();
    } catch (error) {
      console.error("Error saving data:", error);

      // Handle specific archive table errors
      if (shouldArchive && error.message?.includes("time_logs_archive")) {
        showToast(
          "error",
          "Archive table not found. Please create the time_logs_archive table in Supabase first."
        );
      } else if (
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

  const handleArchiveConfirm = async () => {
    setArchiveModalVisible(false);
    const submitData = {
      title: formData.title.trim(),
      description: formData.description || "",
      project: formData.project,
      location: formData.location || null,
      duration: parseFloat(formData.duration),
      deadline_at: formData.deadline_at || null,
    };
    await performSave(submitData, true);
  };

  const handleArchiveCancel = async () => {
    setArchiveModalVisible(false);
    const submitData = {
      title: formData.title.trim(),
      description: formData.description || "",
      project: formData.project,
      location: formData.location || null,
      duration: parseFloat(formData.duration),
      deadline_at: formData.deadline_at || null,
    };
    await performSave(submitData, false);
  };

  const getSelectedProject = () => {
    return projects.find((p) => p.id === formData.project);
  };

  const getSelectedLocation = () => {
    return locations.find((l) => l.id === formData.location);
  };

  const getFilteredProjects = () => {
    if (!projectSearch.trim()) {
      return projects;
    }
    return projects.filter((project) =>
      project.title.toLowerCase().includes(projectSearch.toLowerCase())
    );
  };

  const getFilteredLocations = () => {
    if (!locationSearch.trim()) {
      return locations;
    }
    return locations.filter((location) =>
      location.title.toLowerCase().includes(locationSearch.toLowerCase())
    );
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
  const selectedProject = getSelectedProject();
  const selectedLocation = getSelectedLocation();

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
                Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                ref={titleInputRef}
                style={[styles.input, styles.truncatedInput]}
                placeholder="Enter time log title..."
                placeholderTextColor={theme.colors.textSecondary}
                value={formData.title}
                onChangeText={(text) =>
                  setFormData({ ...formData, title: text })
                }
                returnKeyType="next"
                blurOnSubmit={false}
                ellipsizeMode="tail"
                numberOfLines={1}
                maxLength={100}
                onFocus={() => scrollToInput(titleInputRef)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Project <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setProjectModalVisible(true)}
              >
                <Text
                  style={[
                    styles.pickerText,
                    !selectedProject && styles.pickerPlaceholder,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {selectedProject ? selectedProject.title : "Select a project"}
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
                Deadline <Text style={styles.required}>*</Text>
              </Text>
              <DatePicker
                value={formData.deadline_at}
                onChange={(date) =>
                  setFormData({ ...formData, deadline_at: date })
                }
                placeholder="Select deadline date"
                minimumDate={new Date()}
                defaultToToday={true}
              />
            </View>

            {isEditing && (
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
            )}

            {isEditing && (
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
            )}

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

        {/* Project Selection Modal */}
        <Modal
          visible={projectModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setProjectModalVisible(false);
            setProjectSearch("");
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Project</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setProjectModalVisible(false);
                    setProjectSearch("");
                  }}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.searchInput}
                placeholder="Search projects..."
                placeholderTextColor={theme.colors.textSecondary}
                value={projectSearch}
                onChangeText={setProjectSearch}
                autoCapitalize="none"
                autoCorrect={false}
                ellipsizeMode="tail"
              />

              <View style={styles.listContainer}>
                {getFilteredProjects().length > 0 ? (
                  <FlatList
                    data={getFilteredProjects()}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                      const isSelected = item.id === formData.project;
                      return (
                        <TouchableOpacity
                          style={[
                            styles.item,
                            isSelected && styles.selectedItem,
                          ]}
                          onPress={() => {
                            setFormData({ ...formData, project: item.id });
                            setProjectModalVisible(false);
                            setProjectSearch("");
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
                      {projectSearch.trim()
                        ? "No projects found matching your search"
                        : "No projects available"}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Modal>

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

        {/* Archive Confirmation Modal */}
        <Modal
          visible={archiveModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setArchiveModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { maxWidth: 400 }]}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name="archive-outline"
                  size={32}
                  color={theme.colors.primary}
                />
              </View>

              <Text style={styles.message}>
                Archive the previous record before updating?
              </Text>

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
                This will save a copy of the current data to the archive for
                future reference.
              </Text>

              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={[styles.cancelButton, { flex: 1, marginRight: 6 }]}
                  onPress={handleArchiveCancel}
                  disabled={submitting}
                >
                  <Text
                    style={[styles.buttonText, { color: theme.colors.text }]}
                  >
                    No
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmButton, { flex: 1, marginLeft: 6 }]}
                  onPress={handleArchiveConfirm}
                  disabled={submitting}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      { color: theme.colors.onPrimary },
                    ]}
                  >
                    {submitting ? "Archiving..." : "Yes"}
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
