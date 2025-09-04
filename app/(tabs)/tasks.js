import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "../../src/contexts/ThemeContext";
import {
  taskService,
  projectService,
  moduleService,
  activityService,
} from "../../src/services";
import {
  Card,
  LoadingScreen,
  DeleteConfirmationModal,
  MultiSelectPicker,
  DatePicker,
} from "../../src/components/ui";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

export default function TasksScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Filter states
  const [projects, setProjects] = useState([]);
  const [modules, setModules] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedModules, setSelectedModules] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedUpdatedBy, setSelectedUpdatedBy] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchText, setSearchText] = useState("");
  const [filtersVisible, setFiltersVisible] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      paddingBottom: 10,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: theme.colors.text,
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    addButtonText: {
      color: theme.colors.onPrimary,
      fontWeight: "600",
      marginLeft: 4,
    },
    listContainer: {
      flex: 1,
      paddingHorizontal: 20,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 60,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 8,
    },
    emptyDescription: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: "center",
      marginBottom: 24,
    },
    emptyButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 12,
    },
    emptyButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: "600",
    },
    taskMeta: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
      flexWrap: "wrap",
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 16,
      marginBottom: 4,
    },
    metaText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginLeft: 4,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 8,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "600",
    },
    filterSection: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: 20,
      marginBottom: 10,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filterHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: filtersVisible ? 12 : 0,
      paddingVertical: 8,
    },
    filterTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.text,
    },
    filterToggle: {
      padding: 4,
    },
    filterContent: {
      // Will be handled conditionally in render
    },
    searchInput: {
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 12,
      paddingRight: 44,
      fontSize: 16,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minHeight: 50,
    },
    dateInput: {
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 12,
      paddingRight: 44,
      fontSize: 16,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minHeight: 50,
    },
    clearFiltersButton: {
      backgroundColor: theme.colors.error,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      alignSelf: "flex-end",
      marginTop: 8,
    },
    clearFiltersText: {
      color: theme.colors.onError,
      fontSize: 14,
      fontWeight: "600",
    },
    hintText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 4,
      marginBottom: 8,
    },
    inputContainer: {
      position: "relative",
      marginBottom: 12,
    },
    clearButton: {
      position: "absolute",
      right: 12,
      top: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
      width: 32,
      height: "100%",
      zIndex: 100,
      backgroundColor: "transparent",
    },
    pickerContainer: {
      position: "relative",
      marginBottom: 12,
    },
    pickerClearButton: {
      position: "absolute",
      right: 36,
      top: "50%",
      marginTop: -12,
      padding: 8,
      zIndex: 100,
      backgroundColor: "transparent",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });

  const loadData = useCallback(async () => {
    try {
      const [tasksData, projectsData, modulesData, activitiesData] =
        await Promise.all([
          taskService.getAll(),
          projectService.getAll(),
          moduleService.getAll(),
          activityService.getAll(),
        ]);
      setTasks(
        tasksData.sort(
          (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
        )
      );
      setProjects(projectsData);
      setModules(modulesData);
      setActivities(activitiesData);
    } catch (error) {
      console.error("Error loading data:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load data",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleAdd = () => {
    router.push("/tasks/form");
  };

  const handleView = (task) => {
    if (task && task.id) {
      router.push(`/tasks?id=${task.id}`);
    }
  };

  const handleEdit = (task) => {
    router.push(`/tasks/form?id=${task.id}`);
  };

  const handleDelete = (task) => {
    setItemToDelete(task);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setDeleting(true);
    try {
      await taskService.delete(itemToDelete.id);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Task deleted successfully",
      });
      loadData();
      setDeleteModalVisible(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting task:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete task",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setItemToDelete(null);
  };

  const formatStatus = (status) => {
    if (!status) return "Unknown";
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getStatusBadgeStyle = (status) => {
    const baseStyle = {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 8,
    };

    switch (status) {
      case "done":
        return {
          ...baseStyle,
          backgroundColor: "#34C75920", // Green background for done
        };
      case "in_progress":
        return {
          ...baseStyle,
          backgroundColor: "#FF950020", // Orange background for in progress
        };
      case "pending":
        return {
          ...baseStyle,
          backgroundColor: "#FF3B3020", // Red background for pending
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: theme.colors.secondary + "20",
        };
    }
  };

  const getStatusTextStyle = (status) => {
    const baseStyle = {
      fontSize: 12,
      fontWeight: "600",
    };

    switch (status) {
      case "done":
        return {
          ...baseStyle,
          color: "#34C759", // Green text for done
        };
      case "in_progress":
        return {
          ...baseStyle,
          color: "#FF9500", // Orange text for in progress
        };
      case "pending":
        return {
          ...baseStyle,
          color: "#FF3B30", // Red text for pending
        };
      default:
        return {
          ...baseStyle,
          color: theme.colors.secondary,
        };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const renderTask = ({ item }) => (
    <Card
      id={item.id}
      title={item.title || ""}
      description={item.description || ""}
      created_at={item.created_at}
      updated_at={item.updated_at}
      deadline_at={item.deadline_at}
      status={item.status}
      onPress={() => handleView(item)}
      onEdit={() => handleEdit(item)}
      onDelete={() => handleDelete(item)}
    />
  );

  const renderEmpty = () => {
    const hasFilters =
      selectedProjects.length > 0 ||
      selectedModules.length > 0 ||
      selectedActivities.length > 0 ||
      selectedStatuses.length > 0 ||
      selectedUpdatedBy.length > 0 ||
      (dateFrom && dateFrom.trim()) ||
      (dateTo && dateTo.trim()) ||
      searchText.trim();

    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="clipboard-outline"
          size={64}
          color={theme.colors.textSecondary}
          style={styles.emptyIcon}
        />
        <Text style={styles.emptyTitle}>
          {hasFilters ? "No Tasks Match Filters" : "No Tasks Yet"}
        </Text>
        <Text style={styles.emptyDescription}>
          {hasFilters
            ? "Try adjusting your filters to see more results"
            : "Start managing your tasks by creating your first task"}
        </Text>
        {!hasFilters && (
          <TouchableOpacity style={styles.emptyButton} onPress={handleAdd}>
            <Text style={styles.emptyButtonText}>Add Task</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Tasks</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Ionicons name="add" size={20} color={theme.colors.onPrimary} />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const clearFilters = () => {
    setSelectedProjects([]);
    setSelectedModules([]);
    setSelectedActivities([]);
    setSelectedStatuses([]);
    setSelectedUpdatedBy([]);
    setDateFrom(null);
    setDateTo(null);
    setSearchText("");
  };

  const filteredTasks = tasks.filter((task) => {
    // Search text filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      const matchesTitle = task.title?.toLowerCase().includes(searchLower);
      const matchesDescription = task.description
        ?.toLowerCase()
        .includes(searchLower);
      if (!matchesTitle && !matchesDescription) return false;
    }

    // Project filter
    if (
      selectedProjects.length > 0 &&
      task.project &&
      !selectedProjects.includes(task.project)
    ) {
      return false;
    }

    // Module filter
    if (
      selectedModules.length > 0 &&
      task.module &&
      !selectedModules.includes(task.module)
    ) {
      return false;
    }

    // Activity filter
    if (
      selectedActivities.length > 0 &&
      task.activity &&
      !selectedActivities.includes(task.activity)
    ) {
      return false;
    }

    // Status filter
    if (
      selectedStatuses.length > 0 &&
      task.status &&
      !selectedStatuses.includes(task.status)
    ) {
      return false;
    }

    // Updated by filter
    if (
      selectedUpdatedBy.length > 0 &&
      task.updated_by &&
      !selectedUpdatedBy.includes(task.updated_by)
    ) {
      return false;
    }

    // Date from filter
    if (
      dateFrom &&
      task.updated_at &&
      new Date(task.updated_at) < new Date(dateFrom)
    ) {
      return false;
    }

    // Date to filter
    if (
      dateTo &&
      task.updated_at &&
      new Date(task.updated_at) > new Date(dateTo + "T23:59:59")
    ) {
      return false;
    }

    return true;
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add" size={20} color={theme.colors.onPrimary} />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterSection}>
        <TouchableOpacity
          style={styles.filterHeader}
          onPress={() => setFiltersVisible(!filtersVisible)}
        >
          <Text style={styles.filterTitle}>Filters</Text>
          <Ionicons
            name={filtersVisible ? "chevron-up" : "chevron-down"}
            size={20}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>

        {filtersVisible && (
          <View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search title or description..."
                placeholderTextColor={theme.colors.textSecondary}
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText && searchText.trim().length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setSearchText("")}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>

            <DatePicker
              value={dateFrom}
              onChange={setDateFrom}
              placeholder="From date"
              style={{
                backgroundColor: theme.colors.background,
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                borderWidth: 1,
                borderColor: theme.colors.border,
                minHeight: 50,
                marginBottom: 12,
              }}
            />
            <DatePicker
              value={dateTo}
              onChange={setDateTo}
              placeholder="To date"
              style={{
                backgroundColor: theme.colors.background,
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                borderWidth: 1,
                borderColor: theme.colors.border,
                minHeight: 50,
                marginBottom: 12,
              }}
            />

            <MultiSelectPicker
              value={selectedProjects}
              onValueChange={setSelectedProjects}
              items={projects}
              placeholder="Select projects"
              searchable
            />

            <MultiSelectPicker
              value={selectedModules}
              onValueChange={setSelectedModules}
              items={modules}
              placeholder="Select modules"
              searchable
            />

            <MultiSelectPicker
              value={selectedActivities}
              onValueChange={setSelectedActivities}
              items={activities}
              placeholder="Select activities"
              searchable
            />

            <MultiSelectPicker
              value={selectedStatuses}
              onValueChange={setSelectedStatuses}
              items={[
                { id: "pending", title: "Pending" },
                { id: "in_progress", title: "In Progress" },
                { id: "done", title: "Done" },
              ]}
              placeholder="Select statuses"
              searchable={false}
            />

            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={clearFilters}
            >
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.listContainer}>
        <FlatList
          data={filteredTasks}
          renderItem={renderTask}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>

      <DeleteConfirmationModal
        visible={deleteModalVisible}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task?"
        itemTitle={itemToDelete?.title}
        itemType="task"
        loading={deleting}
      />
    </SafeAreaView>
  );
}
