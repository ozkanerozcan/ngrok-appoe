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
  timeLogService,
  projectService,
  locationService,
  taskService,
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
import { formatDurationEnglish } from "../../src/utils/duration";

export default function TimeLogsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [timeLogs, setTimeLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Filter states
  const [projects, setProjects] = useState([]);
  const [locations, setLocations] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
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
    timeLogMeta: {
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
      const [timeLogsData, projectsData, locationsData, tasksData] =
        await Promise.all([
          timeLogService.getAll(),
          projectService.getAll(),
          locationService.getAll(),
          taskService.getAll(),
        ]);
      setTimeLogs(
        timeLogsData.sort(
          (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
        )
      );
      setProjects(projectsData);
      setLocations(locationsData);
      setTasks(tasksData);
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
    router.push("/timelogs/form");
  };

  const handleEdit = (timeLog) => {
    router.push(`/timelogs/form?id=${timeLog.id}`);
  };

  const handleDelete = (timeLog) => {
    setItemToDelete(timeLog);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setDeleting(true);
    try {
      await timeLogService.delete(itemToDelete.id);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Time log deleted successfully",
      });
      loadData();
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

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setItemToDelete(null);
  };

  const formatDuration = (hours) => {
    return formatDurationEnglish(hours);
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

  const renderTimeLog = ({ item }) => (
    <Card
      id={item.id}
      subtitle={item.tasks?.title ? `Task: ${item.tasks.title}` : null}
      description={item.description || ""}
      created_at={item.created_at}
      updated_at={item.updated_at}
      duration={item.duration}
      onEdit={() => handleEdit(item)}
      onDelete={() => handleDelete(item)}
      rightContent={null}
    />
  );

  const renderEmpty = () => {
    const hasFilters =
      selectedProjects.length > 0 ||
      selectedLocations.length > 0 ||
      selectedTasks.length > 0 ||
      selectedUpdatedBy.length > 0 ||
      (dateFrom && dateFrom.trim()) ||
      (dateTo && dateTo.trim()) ||
      searchText.trim();

    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="time-outline"
          size={64}
          color={theme.colors.textSecondary}
          style={styles.emptyIcon}
        />
        <Text style={styles.emptyTitle}>
          {hasFilters ? "No Time Logs Match Filters" : "No Time Logs Yet"}
        </Text>
        <Text style={styles.emptyDescription}>
          {hasFilters
            ? "Try adjusting your filters to see more results"
            : "Start tracking your time by creating your first time log"}
        </Text>
        {!hasFilters && (
          <TouchableOpacity style={styles.emptyButton} onPress={handleAdd}>
            <Text style={styles.emptyButtonText}>Add Time Log</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Time Logs</Text>
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
    setSelectedLocations([]);
    setSelectedTasks([]);
    setSelectedUpdatedBy([]);
    setDateFrom(null);
    setDateTo(null);
    setSearchText("");
  };

  const filteredTimeLogs = timeLogs
    .filter((log) => {
      // Search text filter
      if (searchText.trim()) {
        const searchLower = searchText.toLowerCase();
        const matchesDescription = log.description
          ?.toLowerCase()
          .includes(searchLower);
        if (!matchesDescription) return false;
      }

      // Task filter
      if (selectedTasks.length > 0 && !selectedTasks.includes(log.task)) {
        return false;
      }

      // Location filter
      if (
        selectedLocations.length > 0 &&
        !selectedLocations.includes(log.location)
      ) {
        return false;
      }

      // Updated by filter
      if (
        selectedUpdatedBy.length > 0 &&
        !selectedUpdatedBy.includes(log.updated_by)
      ) {
        return false;
      }

      // Date from filter
      if (dateFrom && new Date(log.updated_at) < new Date(dateFrom)) {
        return false;
      }

      // Date to filter
      if (dateTo && new Date(log.updated_at) > new Date(dateTo + "T23:59:59")) {
        return false;
      }

      return true;
    })
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Time Logs</Text>
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
                placeholder="Search description..."
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
              value={selectedTasks}
              onValueChange={setSelectedTasks}
              items={tasks}
              placeholder="Select tasks"
              searchable
            />

            <MultiSelectPicker
              value={selectedLocations}
              onValueChange={setSelectedLocations}
              items={locations}
              placeholder="Select locations"
              searchable
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
          data={filteredTimeLogs}
          renderItem={renderTimeLog}
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
        title="Delete Time Log"
        message="Are you sure you want to delete this time log?"
        itemType="time log"
        loading={deleting}
      />
    </SafeAreaView>
  );
}
