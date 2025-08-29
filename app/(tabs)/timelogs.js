import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "../../src/contexts/ThemeContext";
import { timeLogService } from "../../src/services";
import {
  Card,
  LoadingScreen,
  DeleteConfirmationModal,
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

  const loadTimeLogs = useCallback(async () => {
    try {
      const data = await timeLogService.getAll();
      setTimeLogs(data);
    } catch (error) {
      console.error("Error loading time logs:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load time logs",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTimeLogs();
    }, [loadTimeLogs])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTimeLogs();
  }, [loadTimeLogs]);

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
      loadTimeLogs();
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
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderTimeLog = ({ item }) => (
    <Card
      title={item.title}
      description={item.description}
      created_by={item.created_by_profile}
      created_at={item.created_at}
      updated_by={item.updated_by_profile}
      updated_at={item.updated_at}
      project={item.projects}
      location={item.locations}
      duration={item.duration}
      onEdit={() => handleEdit(item)}
      onDelete={() => handleDelete(item)}
      rightContent={
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>
            {formatDuration(item.duration)}
          </Text>
        </View>
      }
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="time-outline"
        size={64}
        color={theme.colors.textSecondary}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>No Time Logs Yet</Text>
      <Text style={styles.emptyDescription}>
        Start tracking your time by creating your first time log
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleAdd}>
        <Text style={styles.emptyButtonText}>Add Time Log</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <LoadingScreen
        title="Loading time logs..."
        icon="time-outline"
        size="small"
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Time Logs</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add" size={20} color={theme.colors.onPrimary} />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        <FlatList
          data={timeLogs}
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
        itemTitle={itemToDelete?.title}
        itemType="time log"
        loading={deleting}
      />
    </SafeAreaView>
  );
}
