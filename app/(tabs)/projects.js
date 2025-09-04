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
import { useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "../../src/contexts/ThemeContext";
import { projectService, timeLogService } from "../../src/services";
import {
  Card,
  LoadingScreen,
  DeleteConfirmationModal,
} from "../../src/components/ui";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

export default function ProjectsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projectStats, setProjectStats] = useState({});
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

  const loadProjects = useCallback(async () => {
    try {
      const data = await projectService.getAll();
      setProjects(data);

      // Load stats for each project
      const stats = {};
      for (const project of data) {
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
      console.error("Error loading projects:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load projects",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [loadProjects])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProjects();
  }, [loadProjects]);

  const handleAdd = () => {
    router.push("/projects/form");
  };

  const handleEdit = (project) => {
    router.push(`/projects/form?id=${project.id}`);
  };

  const handleDelete = (project) => {
    setItemToDelete(project);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setDeleting(true);
    try {
      await projectService.delete(itemToDelete.id);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Project deleted successfully",
      });
      loadProjects();
      setDeleteModalVisible(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting project:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete project",
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
    if (hours === 0) return "0h";
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    return `${hours.toFixed(1)}h`;
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
        onEdit={() => handleEdit(item)}
        onDelete={() => handleDelete(item)}
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

  const renderEmpty = () => (
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

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Projects</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Ionicons name="add" size={20} color={theme.colors.onPrimary} />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Projects</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add" size={20} color={theme.colors.onPrimary} />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        <FlatList
          data={projects}
          renderItem={renderProject}
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
        title="Delete Project"
        message="Are you sure you want to delete this project? This will also delete all associated time logs."
        itemTitle={itemToDelete?.title}
        itemType="project"
        loading={deleting}
      />
    </View>
  );
}
