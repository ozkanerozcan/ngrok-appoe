import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "../../src/contexts/ThemeContext";
import { activityService } from "../../src/services";
import {
  Card,
  LoadingScreen,
  DeleteConfirmationModal,
} from "../../src/components/ui";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

export default function ActivitiesScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [searchText, setSearchText] = useState("");

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
    searchInput: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 12,
      paddingRight: 44,
      fontSize: 16,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginHorizontal: 20,
      marginBottom: 10,
      minHeight: 50,
    },
    clearButton: {
      position: "absolute",
      right: 32,
      top: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
      width: 32,
      height: "100%",
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
      const activitiesData = await activityService.getAll();
      setActivities(
        activitiesData.sort(
          (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
        )
      );
    } catch (error) {
      console.error("Error loading activities:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load activities",
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
    router.push("/activities/form");
  };

  const handleEdit = (activity) => {
    router.push(`/activities/form?id=${activity.id}`);
  };

  const handleDelete = (activity) => {
    setItemToDelete(activity);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setDeleting(true);
    try {
      await activityService.delete(itemToDelete.id);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Activity deleted successfully",
      });
      loadData();
      setDeleteModalVisible(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting activity:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete activity",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setItemToDelete(null);
  };

  const renderActivity = ({ item }) => (
    <Card
      id={item.id}
      title={item.title || ""}
      description={item.description || ""}
      created_at={item.created_at}
      updated_at={item.updated_at}
      onEdit={() => handleEdit(item)}
      onDelete={() => handleDelete(item)}
    />
  );

  const renderEmpty = () => {
    const hasFilters = searchText.trim();

    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="bulb-outline"
          size={64}
          color={theme.colors.textSecondary}
          style={styles.emptyIcon}
        />
        <Text style={styles.emptyTitle}>
          {hasFilters ? "No Activities Match Search" : "No Activities Yet"}
        </Text>
        <Text style={styles.emptyDescription}>
          {hasFilters
            ? "Try adjusting your search to see more results"
            : "Start managing your activities by creating your first activity"}
        </Text>
        {!hasFilters && (
          <TouchableOpacity style={styles.emptyButton} onPress={handleAdd}>
            <Text style={styles.emptyButtonText}>Add Activity</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Activities</Text>
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

  const filteredActivities = activities.filter((activity) => {
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      const matchesTitle = activity.title?.toLowerCase().includes(searchLower);
      const matchesDescription = activity.description
        ?.toLowerCase()
        .includes(searchLower);
      if (!matchesTitle && !matchesDescription) return false;
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Activities</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add" size={20} color={theme.colors.onPrimary} />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search activities..."
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

      <View style={styles.listContainer}>
        <FlatList
          data={filteredActivities}
          renderItem={renderActivity}
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
        title="Delete Activity"
        message="Are you sure you want to delete this activity?"
        itemTitle={itemToDelete?.title}
        itemType="activity"
        loading={deleting}
      />
    </SafeAreaView>
  );
}
