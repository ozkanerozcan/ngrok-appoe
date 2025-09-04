import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "../../src/contexts/ThemeContext";
import {
  projectService,
  locationService,
  timeLogService,
  activityService,
  moduleService,
} from "../../src/services";
import {
  Card,
  LoadingScreen,
  DeleteConfirmationModal,
} from "../../src/components/ui";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { formatDurationEnglish } from "../../src/utils/duration";

export default function ManageScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("projects");
  const [projects, setProjects] = useState([]);
  const [locations, setLocations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projectStats, setProjectStats] = useState({});
  const [deleteProjectModalVisible, setDeleteProjectModalVisible] =
    useState(false);
  const [deleteLocationModalVisible, setDeleteLocationModalVisible] =
    useState(false);
  const [deleteActivityModalVisible, setDeleteActivityModalVisible] =
    useState(false);
  const [deleteModuleModalVisible, setDeleteModuleModalVisible] =
    useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [locationToDelete, setLocationToDelete] = useState(null);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [moduleToDelete, setModuleToDelete] = useState(null);
  const [deletingProject, setDeletingProject] = useState(false);
  const [deletingLocation, setDeletingLocation] = useState(false);
  const [deletingActivity, setDeletingActivity] = useState(false);
  const [deletingModule, setDeletingModule] = useState(false);

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
    tabContainer: {
      flexDirection: "row",
      paddingHorizontal: 20,
      marginBottom: 10,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginHorizontal: 4,
      alignItems: "center",
    },
    activeTab: {
      backgroundColor: theme.colors.primary,
    },
    inactiveTab: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    tabText: {
      fontSize: 16,
      fontWeight: "600",
    },
    activeTabText: {
      color: theme.colors.onPrimary,
    },
    inactiveTabText: {
      color: theme.colors.text,
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
    statsContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
    },
    statsText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginLeft: 4,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });

  const loadData = useCallback(async () => {
    try {
      // Load all data in parallel
      const [projectsData, locationsData, activitiesData, modulesData] =
        await Promise.all([
          projectService.getAll(),
          locationService.getAll(),
          activityService.getAll(),
          moduleService.getAll(),
        ]);

      setProjects(projectsData);
      setLocations(locationsData);
      setActivities(activitiesData);
      setModules(modulesData);

      // Load stats for each project
      const stats = {};
      for (const project of projectsData) {
        try {
          const totalDuration = await timeLogService.getTotalDurationByProject(
            project.id
          );
          stats[project.id] = { totalDuration };
        } catch (error) {
          console.error(
            `Error loading stats for project ${project.id}:`,
            error
          );
          stats[project.id] = { totalDuration: 0 };
        }
      }
      setProjectStats(stats);
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
    if (activeTab === "projects") {
      router.push("/projects/form");
    } else if (activeTab === "locations") {
      router.push("/locations/form");
    } else if (activeTab === "activities") {
      router.push("/activities/form");
    } else if (activeTab === "modules") {
      router.push("/modules/form");
    }
  };

  const handleEditProject = (project) => {
    router.push(`/projects/form?id=${project.id}`);
  };

  const handleEditLocation = (location) => {
    router.push(`/locations/form?id=${location.id}`);
  };

  const handleDeleteProject = (project) => {
    setProjectToDelete(project);
    setDeleteProjectModalVisible(true);
  };

  const handleConfirmDeleteProject = async () => {
    if (!projectToDelete) return;

    setDeletingProject(true);
    try {
      await projectService.delete(projectToDelete.id);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Project deleted successfully",
      });
      loadData();
      setDeleteProjectModalVisible(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error("Error deleting project:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete project",
      });
    } finally {
      setDeletingProject(false);
    }
  };

  const handleCancelDeleteProject = () => {
    setDeleteProjectModalVisible(false);
    setProjectToDelete(null);
  };

  const handleDeleteLocation = (location) => {
    setLocationToDelete(location);
    setDeleteLocationModalVisible(true);
  };

  const handleConfirmDeleteLocation = async () => {
    if (!locationToDelete) return;

    setDeletingLocation(true);
    try {
      await locationService.delete(locationToDelete.id);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Location deleted successfully",
      });
      loadData();
      setDeleteLocationModalVisible(false);
      setLocationToDelete(null);
    } catch (error) {
      console.error("Error deleting location:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete location",
      });
    } finally {
      setDeletingLocation(false);
    }
  };

  const handleCancelDeleteLocation = () => {
    setDeleteLocationModalVisible(false);
    setLocationToDelete(null);
  };

  const handleEditActivity = (activity) => {
    router.push(`/activities/form?id=${activity.id}`);
  };

  const handleEditModule = (module) => {
    router.push(`/modules/form?id=${module.id}`);
  };

  const handleDeleteActivity = (activity) => {
    setActivityToDelete(activity);
    setDeleteActivityModalVisible(true);
  };

  const handleDeleteModule = (module) => {
    setModuleToDelete(module);
    setDeleteModuleModalVisible(true);
  };

  const handleConfirmDeleteActivity = async () => {
    if (!activityToDelete) return;

    setDeletingActivity(true);
    try {
      await activityService.delete(activityToDelete.id);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Activity deleted successfully",
      });
      loadData();
      setDeleteActivityModalVisible(false);
      setActivityToDelete(null);
    } catch (error) {
      console.error("Error deleting activity:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete activity",
      });
    } finally {
      setDeletingActivity(false);
    }
  };

  const handleConfirmDeleteModule = async () => {
    if (!moduleToDelete) return;

    setDeletingModule(true);
    try {
      await moduleService.delete(moduleToDelete.id);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Module deleted successfully",
      });
      loadData();
      setDeleteModuleModalVisible(false);
      setModuleToDelete(null);
    } catch (error) {
      console.error("Error deleting module:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete module",
      });
    } finally {
      setDeletingModule(false);
    }
  };

  const handleCancelDeleteActivity = () => {
    setDeleteActivityModalVisible(false);
    setActivityToDelete(null);
  };

  const handleCancelDeleteModule = () => {
    setDeleteModuleModalVisible(false);
    setModuleToDelete(null);
  };

  const formatDuration = (hours) => {
    return formatDurationEnglish(hours);
  };

  const renderProject = ({ item }) => {
    const stats = projectStats[item.id] || { totalDuration: 0 };

    return (
      <Card
        title={item.title}
        description={item.description}
        created_by={item.created_by_profile}
        created_at={item.created_at}
        updated_by={item.updated_by_profile}
        updated_at={item.updated_at}
        onEdit={() => handleEditProject(item)}
        onDelete={() => handleDeleteProject(item)}
        rightContent={
          <View style={styles.statsContainer}>
            <Ionicons
              name="time-outline"
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.statsText}>
              {formatDuration(stats.totalDuration)}
            </Text>
          </View>
        }
      />
    );
  };

  const renderLocation = ({ item }) => (
    <Card
      title={item.title}
      description={item.description}
      created_by={item.created_by_profile}
      created_at={item.created_at}
      updated_by={item.updated_by_profile}
      updated_at={item.updated_at}
      onEdit={() => handleEditLocation(item)}
      onDelete={() => handleDeleteLocation(item)}
    />
  );

  const renderActivity = ({ item }) => (
    <Card
      title={item.title}
      description={item.description}
      created_at={item.created_at}
      updated_at={item.updated_at}
      onEdit={() => handleEditActivity(item)}
      onDelete={() => handleDeleteActivity(item)}
    />
  );

  const renderModule = ({ item }) => (
    <Card
      title={item.title}
      description={item.description}
      created_at={item.created_at}
      updated_at={item.updated_at}
      onEdit={() => handleEditModule(item)}
      onDelete={() => handleDeleteModule(item)}
    />
  );

  const renderEmptyProjects = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="folder-outline"
        size={64}
        color={theme.colors.textSecondary}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>No Projects Yet</Text>
      <Text style={styles.emptyDescription}>
        Create your first project to organize your time tracking
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleAdd}>
        <Text style={styles.emptyButtonText}>Add Project</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyLocations = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="location-outline"
        size={64}
        color={theme.colors.textSecondary}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>No Locations Yet</Text>
      <Text style={styles.emptyDescription}>
        Create your first location to get started with time tracking
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleAdd}>
        <Text style={styles.emptyButtonText}>Add Location</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyActivities = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="bulb-outline"
        size={64}
        color={theme.colors.textSecondary}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>No Activities Yet</Text>
      <Text style={styles.emptyDescription}>
        Create your first activity to organize your tasks
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleAdd}>
        <Text style={styles.emptyButtonText}>Add Activity</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyModules = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="folder-outline"
        size={64}
        color={theme.colors.textSecondary}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>No Modules Yet</Text>
      <Text style={styles.emptyDescription}>
        Create your first module to categorize your tasks
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleAdd}>
        <Text style={styles.emptyButtonText}>Add Module</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Manage</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Ionicons name="add" size={20} color={theme.colors.onPrimary} />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, styles.inactiveTab]} disabled>
            <Text style={[styles.tabText, styles.inactiveTabText]}>
              Projects
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, styles.inactiveTab]} disabled>
            <Text style={[styles.tabText, styles.inactiveTabText]}>
              Locations
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, styles.inactiveTab]} disabled>
            <Text style={[styles.tabText, styles.inactiveTabText]}>
              Activities
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, styles.inactiveTab]} disabled>
            <Text style={[styles.tabText, styles.inactiveTabText]}>
              Modules
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const getCurrentData = () => {
    switch (activeTab) {
      case "projects":
        return projects;
      case "locations":
        return locations;
      case "activities":
        return activities;
      case "modules":
        return modules;
      default:
        return projects;
    }
  };

  const getRenderItem = () => {
    switch (activeTab) {
      case "projects":
        return renderProject;
      case "locations":
        return renderLocation;
      case "activities":
        return renderActivity;
      case "modules":
        return renderModule;
      default:
        return renderProject;
    }
  };

  const getRenderEmpty = () => {
    switch (activeTab) {
      case "projects":
        return renderEmptyProjects;
      case "locations":
        return renderEmptyLocations;
      case "activities":
        return renderEmptyActivities;
      case "modules":
        return renderEmptyModules;
      default:
        return renderEmptyProjects;
    }
  };

  const currentData = getCurrentData();
  const renderItem = getRenderItem();
  const renderEmpty = getRenderEmpty();

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add" size={20} color={theme.colors.onPrimary} />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "projects" ? styles.activeTab : styles.inactiveTab,
          ]}
          onPress={() => setActiveTab("projects")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "projects"
                ? styles.activeTabText
                : styles.inactiveTabText,
            ]}
          >
            Projects
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "locations" ? styles.activeTab : styles.inactiveTab,
          ]}
          onPress={() => setActiveTab("locations")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "locations"
                ? styles.activeTabText
                : styles.inactiveTabText,
            ]}
          >
            Locations
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "activities" ? styles.activeTab : styles.inactiveTab,
          ]}
          onPress={() => setActiveTab("activities")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "activities"
                ? styles.activeTabText
                : styles.inactiveTabText,
            ]}
          >
            Activities
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "modules" ? styles.activeTab : styles.inactiveTab,
          ]}
          onPress={() => setActiveTab("modules")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "modules"
                ? styles.activeTabText
                : styles.inactiveTabText,
            ]}
          >
            Modules
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        <FlatList
          data={currentData}
          renderItem={renderItem}
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
        visible={deleteProjectModalVisible}
        onClose={handleCancelDeleteProject}
        onConfirm={handleConfirmDeleteProject}
        title="Delete Project"
        message="Are you sure you want to delete this project? This will also delete all associated time logs."
        itemTitle={projectToDelete?.title}
        itemType="project"
        loading={deletingProject}
      />

      <DeleteConfirmationModal
        visible={deleteLocationModalVisible}
        onClose={handleCancelDeleteLocation}
        onConfirm={handleConfirmDeleteLocation}
        title="Delete Location"
        message="Are you sure you want to delete this location?"
        itemTitle={locationToDelete?.title}
        itemType="location"
        loading={deletingLocation}
      />

      <DeleteConfirmationModal
        visible={deleteActivityModalVisible}
        onClose={handleCancelDeleteActivity}
        onConfirm={handleConfirmDeleteActivity}
        title="Delete Activity"
        message="Are you sure you want to delete this activity?"
        itemTitle={activityToDelete?.title}
        itemType="activity"
        loading={deletingActivity}
      />

      <DeleteConfirmationModal
        visible={deleteModuleModalVisible}
        onClose={handleCancelDeleteModule}
        onConfirm={handleConfirmDeleteModule}
        title="Delete Module"
        message="Are you sure you want to delete this module?"
        itemTitle={moduleToDelete?.title}
        itemType="module"
        loading={deletingModule}
      />
    </SafeAreaView>
  );
}
