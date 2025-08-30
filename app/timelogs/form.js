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
import { DurationInput } from "../../src/components/ui";

export default function TimeLogFormScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project: "",
    location: "",
    duration: "",
  });
  const [projects, setProjects] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
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
      const timeLog = await timeLogService.getById(id);
      setFormData({
        title: timeLog.title || "",
        description: timeLog.description || "",
        project: timeLog.project || "",
        location: timeLog.location || "",
        duration: timeLog.duration || "",
      });
    } catch (error) {
      console.error("Error loading time log:", error);
      showToast("error", "Failed to load time log");
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

    if (!formData.location) {
      showToast("error", "Please select a location");
      return;
    }

    if (!formData.duration) {
      showToast("error", "Please enter duration");
      return;
    }

    // Handle duration parsing more robustly
    let duration;
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

    console.log("Submitting with duration:", duration);

    setSubmitting(true);
    try {
      const submitData = {
        title: formData.title.trim(),
        description: formData.description || "",
        project: formData.project,
        location: formData.location,
        duration: duration,
      };

      console.log("Submit data:", submitData);

      if (isEditing) {
        await timeLogService.update(id, submitData);
        showToast("success", "Time log updated successfully");
      } else {
        await timeLogService.create(submitData);
        showToast("success", "Time log created successfully");
      }
      router.back();
    } catch (error) {
      console.error("Error saving time log:", error);
      showToast("error", error.message || "Failed to save time log");
    } finally {
      setSubmitting(false);
    }
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
    textArea: {
      minHeight: 120,
      textAlignVertical: "top",
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
              {isEditing ? "Edit Time Log" : "Add Time Log"}
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
                style={styles.input}
                placeholder="Enter time log title..."
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
                style={[styles.input, styles.textArea]}
                placeholder="Enter time log description..."
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
      </SafeAreaView>
    </ProtectedRoute>
  );
}
