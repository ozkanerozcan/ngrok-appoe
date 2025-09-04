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
import { taskService, projectService } from "../../src/services";
import { showToast } from "../../src/utils/toast";
import ProtectedRoute from "../../src/components/ProtectedRoute";
import { Ionicons } from "@expo/vector-icons";
import { DatePicker } from "../../src/components/ui";

export default function TaskFormScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { id } = params;
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project: "",
    deadline_at: null,
    status: "pending",
  });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
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
    loadData();
  }, []);

  useEffect(() => {
    if (isEditing) {
      loadTask();
    } else {
      // For new tasks, set deadline to today + 7 days
      const today = new Date();
      today.setDate(today.getDate() + 7);
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const todayString = `${year}-${month}-${day}`;
      setFormData((prev) => ({ ...prev, deadline_at: todayString }));
    }
  }, [id, isEditing]);

  const loadData = async () => {
    try {
      const projectsData = await projectService.getAll();
      setProjects(projectsData);
    } catch (error) {
      console.error("Error loading data:", error);
      showToast("error", "Failed to load data");
    }
  };

  const loadTask = async () => {
    setLoading(true);
    try {
      const data = await taskService.getById(id);

      setFormData({
        title: data.title || "",
        description: data.description || "",
        project: data.project || "",
        deadline_at: data.deadline_at || null,
        status: data.status || "pending",
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

    const submitData = {
      title: formData.title.trim(),
      description: formData.description || "",
      project: formData.project,
      deadline_at: formData.deadline_at,
      status: formData.status,
    };

    console.log("Submit data:", submitData);

    setSubmitting(true);
    try {
      if (isEditing) {
        await taskService.update(id, submitData);
        showToast("success", "Task updated successfully");
      } else {
        await taskService.create(submitData);
        showToast("success", "Task created successfully");
      }
      router.back();
    } catch (error) {
      console.error("Error saving data:", error);
      showToast("error", error.message || "Failed to save data");
    } finally {
      setSubmitting(false);
    }
  };

  const getSelectedProject = () => {
    return projects.find((p) => p.id === formData.project);
  };

  const getFilteredProjects = () => {
    if (!projectSearch.trim()) {
      return projects;
    }
    return projects.filter((project) =>
      project.title.toLowerCase().includes(projectSearch.toLowerCase())
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
              {isEditing ? "Edit Task" : "Add Task"}
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
              {isEditing ? "Edit Task" : "Add Task"}
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
                placeholder="Enter task title..."
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
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Status</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setStatusModalVisible(true)}
              >
                <Text
                  style={[
                    styles.pickerText,
                    !formData.status && styles.pickerPlaceholder,
                  ]}
                >
                  {formData.status === "pending"
                    ? "Pending"
                    : formData.status === "in_progress"
                    ? "In Progress"
                    : formData.status === "done"
                    ? "Done"
                    : "Select status"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                ref={descriptionInputRef}
                style={[styles.input, styles.descriptionInput]}
                placeholder="Enter task description..."
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

        {/* Status Selection Modal */}
        <Modal
          visible={statusModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setStatusModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Status</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setStatusModalVisible(false)}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.listContainer}>
                <TouchableOpacity
                  style={[
                    styles.item,
                    formData.status === "pending" && styles.selectedItem,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, status: "pending" });
                    setStatusModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.itemText,
                      formData.status === "pending" && styles.selectedItemText,
                    ]}
                  >
                    Pending
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.item,
                    formData.status === "in_progress" && styles.selectedItem,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, status: "in_progress" });
                    setStatusModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.itemText,
                      formData.status === "in_progress" &&
                        styles.selectedItemText,
                    ]}
                  >
                    In Progress
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.item,
                    formData.status === "done" && styles.selectedItem,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, status: "done" });
                    setStatusModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.itemText,
                      formData.status === "done" && styles.selectedItemText,
                    ]}
                  >
                    Done
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
