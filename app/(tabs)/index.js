import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "../../src/contexts/ThemeContext";
import { useAuth } from "../../src/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import {
  timeLogService,
  projectService,
  locationService,
  taskService,
} from "../../src/services";
import { formatDurationEnglish } from "../../src/utils/duration";
import { showToast } from "../../src/utils/toast";

export default function DashboardScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();

  const getDisplayName = (user) => {
    // Use full_name from metadata if available, otherwise use email part before @
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    return user?.email ? user.email.split("@")[0] : "User";
  };

  const [dashboardData, setDashboardData] = useState({
    todayTotal: 0,
    weekTotal: 0,
    monthTotal: 0,
    averageDaily: 0,
    activeDays: 0,
    totalTimeLogs: 0,
    mostActiveProject: null,
    mostActiveLocation: null,
    totalProjects: 0,
    totalLocations: 0,
    recentLogs: [],
    // Daily goal tracking
    dailyGoal: 8.5, // 8.5 hours per day
    goalProgress: 0,
    remainingTime: 8.5,
    overtimeHours: 0,
    goalStatus: "not-started", // 'not-started', 'in-progress', 'completed', 'overachieved'
    // Deadline tracking
    approachingDeadlines: [],
    overdueDeadlines: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      // Load all data in parallel
      const [timeLogs, projects, locations, tasks] = await Promise.all([
        timeLogService.getAll(),
        projectService.getAll(),
        locationService.getAll(),
        taskService.getAll(),
      ]);

      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      // Calculate today's total
      const todayTotal = timeLogs
        .filter((log) => new Date(log.updated_at || log.created_at) >= today)
        .reduce((sum, log) => sum + (log.duration || 0), 0);

      // Calculate this week's total
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekTotal = timeLogs
        .filter(
          (log) => new Date(log.updated_at || log.created_at) >= weekStart
        )
        .reduce((sum, log) => sum + (log.duration || 0), 0);

      // Calculate this month's total
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthTotal = timeLogs
        .filter(
          (log) => new Date(log.updated_at || log.created_at) >= monthStart
        )
        .reduce((sum, log) => sum + (log.duration || 0), 0);

      // Calculate average daily time and active days (last 30 days)
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      const recentLogs = timeLogs.filter(
        (log) => new Date(log.updated_at || log.created_at) >= thirtyDaysAgo
      );
      const uniqueDays = [
        ...new Set(
          recentLogs.map((log) =>
            new Date(log.updated_at || log.created_at).toDateString()
          )
        ),
      ].length;
      const averageDaily =
        uniqueDays > 0
          ? recentLogs.reduce((sum, log) => sum + (log.duration || 0), 0) /
            uniqueDays
          : 0;
      const activeDays = uniqueDays;

      // Find most active project
      const projectStats = {};
      timeLogs.forEach((log) => {
        if (log.project) {
          projectStats[log.project] =
            (projectStats[log.project] || 0) + (log.duration || 0);
        }
      });
      const mostActiveProjectId = Object.keys(projectStats).reduce(
        (a, b) => (projectStats[a] > projectStats[b] ? a : b),
        null
      );
      const mostActiveProject = mostActiveProjectId
        ? projects.find((p) => p.id === mostActiveProjectId)
        : null;

      // Find most active location
      const locationStats = {};
      timeLogs.forEach((log) => {
        if (log.location) {
          locationStats[log.location] =
            (locationStats[log.location] || 0) + (log.duration || 0);
        }
      });
      const mostActiveLocationId = Object.keys(locationStats).reduce(
        (a, b) => (locationStats[a] > locationStats[b] ? a : b),
        null
      );
      const mostActiveLocation = mostActiveLocationId
        ? locations.find((l) => l.id === mostActiveLocationId)
        : null;

      // Calculate daily goal progress
      const dailyGoal = 8.5; // 8.5 hours target
      const goalProgress = Math.min((todayTotal / dailyGoal) * 100, 100);
      const remainingTime = Math.max(dailyGoal - todayTotal, 0);
      const overtimeHours = Math.max(todayTotal - dailyGoal, 0);

      let goalStatus = "not-started";
      if (todayTotal > 0 && todayTotal < dailyGoal) {
        goalStatus = "in-progress";
      } else if (todayTotal >= dailyGoal) {
        goalStatus = todayTotal > dailyGoal ? "overachieved" : "completed";
      }

      // Calculate deadline-related data
      const currentDate = new Date();
      const todayForDeadlines = new Date(currentDate);
      todayForDeadlines.setHours(0, 0, 0, 0); // Set to start of today
      const oneWeekFromNow = new Date(todayForDeadlines);
      oneWeekFromNow.setDate(todayForDeadlines.getDate() + 7);

      // Filter tasks with deadlines
      const tasksWithDeadlines = tasks.filter((task) => task.deadline_at);

      console.log("Total tasks:", tasks.length);
      console.log("Tasks with deadlines:", tasksWithDeadlines.length);
      console.log("Today for deadlines:", todayForDeadlines.toDateString());
      console.log("One week from now:", oneWeekFromNow.toDateString());

      // Helper function to compare only dates (ignore time)
      const isSameDate = (date1, date2) => {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return (
          d1.getFullYear() === d2.getFullYear() &&
          d1.getMonth() === d2.getMonth() &&
          d1.getDate() === d2.getDate()
        );
      };

      const isBeforeDate = (date1, date2) => {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        d1.setHours(0, 0, 0, 0);
        d2.setHours(0, 0, 0, 0);
        return d1 < d2;
      };

      // Approaching deadlines (within 1 week, not done)
      const approachingDeadlines = tasksWithDeadlines
        .filter((task) => {
          const deadline = new Date(task.deadline_at);
          deadline.setHours(0, 0, 0, 0); // Set to start of day for date-only comparison
          const isApproaching =
            deadline >= todayForDeadlines &&
            deadline <= oneWeekFromNow &&
            task.status !== "done";

          if (isApproaching) {
            console.log(
              "Approaching task found:",
              task.title,
              "deadline:",
              deadline.toDateString()
            );
          }

          return isApproaching;
        })
        .sort((a, b) => new Date(a.deadline_at) - new Date(b.deadline_at))
        .slice(0, 5); // Show top 5

      // Overdue deadlines (past current date, not done)
      const overdueDeadlines = tasksWithDeadlines
        .filter((task) => {
          const deadline = new Date(task.deadline_at);
          deadline.setHours(0, 0, 0, 0); // Set to start of day for date-only comparison
          const isOverdue =
            deadline < todayForDeadlines && task.status !== "done";

          if (isOverdue) {
            console.log(
              "Overdue task found:",
              task.title,
              "deadline:",
              deadline.toDateString()
            );
          }

          return isOverdue;
        })
        .sort((a, b) => new Date(a.deadline_at) - new Date(b.deadline_at))
        .slice(0, 5); // Show top 5

      console.log("Approaching deadlines found:", approachingDeadlines.length);
      console.log("Overdue deadlines found:", overdueDeadlines.length);

      // Get recent logs (last 3, sorted by updated_at descending)
      const recentLogsList = timeLogs
        .sort(
          (a, b) =>
            new Date(b.updated_at || b.created_at) -
            new Date(a.updated_at || a.created_at)
        )
        .slice(0, 3);

      setDashboardData({
        todayTotal,
        weekTotal,
        monthTotal,
        averageDaily,
        activeDays,
        totalTimeLogs: timeLogs.length,
        mostActiveProject,
        mostActiveLocation,
        totalProjects: projects.length,
        totalLocations: locations.length,
        recentLogs: recentLogsList,
        dailyGoal,
        goalProgress,
        remainingTime,
        overtimeHours,
        goalStatus,
        approachingDeadlines,
        overdueDeadlines,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      showToast("error", "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      padding: 20,
    },
    headerCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    welcomeTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.colors.text,
      marginBottom: 8,
    },
    welcomeSubtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    statsContainer: {
      marginBottom: 20,
    },
    statsTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 16,
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    statCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      width: "31.5%",
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 85,
    },
    statIcon: {
      marginBottom: 6,
    },
    statValue: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.colors.primary,
      marginBottom: 2,
      textAlign: "center",
      numberOfLines: 1,
      adjustsFontSizeToFit: true,
      minimumFontScale: 0.8,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: "center",
      numberOfLines: 1,
    },
    recentContainer: {
      marginBottom: 20,
    },
    recentTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 16,
    },
    recentItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    recentItemTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 4,
    },
    recentItemMeta: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    quickActionsCard: {
      marginTop: 10,
      marginBottom: 20,
    },
    quickActionsTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 16,
    },
    quickActionsGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    quickActionItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 8,
      width: "23%",
      height: 70,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.03,
      shadowRadius: 2,
      elevation: 1,
      flexDirection: "column",
      alignContent: "center",
    },
    quickActionIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primary + "10",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
      paddingTop: 2,
      alignSelf: "center",
    },
    quickActionLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: theme.colors.text,
      textAlign: "center",
      lineHeight: 12,
      alignSelf: "center",
      width: "100%",
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
    insightsGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    insightCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      width: "31.5%",
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: "row",
      alignItems: "center",
    },
    insightContent: {
      flex: 1,
      marginLeft: 12,
    },
    insightValue: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 2,
    },
    insightLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    goalSection: {
      marginBottom: 20,
    },
    goalTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 16,
    },
    goalProgressWrapper: {
      marginBottom: 16,
    },
    goalProgressInfo: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    goalTargetText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      fontWeight: "500",
    },
    goalTargetContainer: {
      flex: 1,
      marginBottom: 8,
    },
    goalProgressStats: {
      alignItems: "flex-end",
    },
    goalProgressPercent: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.colors.primary,
      marginBottom: 2,
    },
    goalStatusText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: "right",
    },
    progressBarContainer: {
      height: 8,
      backgroundColor: theme.colors.border,
      borderRadius: 4,
      overflow: "hidden",
    },
    progressBar: {
      height: "100%",
      borderRadius: 4,
      transition: "width 0.3s ease",
    },
    goalMetricsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    goalMetric: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      width: "48%",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    fullWidthMetric: {
      width: "100%",
    },
    goalMetricLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: "500",
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    goalMetricValue: {
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: "600",
    },
    overtimeMetric: {
      backgroundColor: "#FEF3C7", // Light yellow background
      borderColor: "#F59E0B", // Orange border
    },
    overtimeValue: {
      color: "#D97706", // Darker orange text
    },
    overtimeCard: {
      backgroundColor: "#FEF3C7", // Light yellow background
      borderColor: "#F59E0B", // Orange border
    },
    overtimeIndicator: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
      paddingVertical: 4,
      paddingHorizontal: 8,
      backgroundColor: "#FEF3C7",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#F59E0B",
    },
    overtimeIndicatorBelow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      marginTop: 6,
      paddingVertical: 4,
      paddingHorizontal: 8,
      backgroundColor: "#FEF3C7",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#F59E0B",
      alignSelf: "flex-start",
    },
    overtimeIcon: {
      marginRight: 4,
    },
    overtimeText: {
      fontSize: 12,
      color: "#D97706",
      fontWeight: "500",
    },
    deadlineSection: {
      marginTop: 10,
      marginBottom: 20,
    },
    deadlineTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 16,
    },
    deadlineItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    deadlineItemTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 4,
    },
    deadlineItemMeta: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    deadlineDate: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.primary,
    },
    approachingDeadlineItem: {
      borderLeftWidth: 4,
      borderLeftColor: "#F59E0B", // Orange for approaching
    },
    overdueDeadlineItem: {
      borderLeftWidth: 4,
      borderLeftColor: "#EF4444", // Red for overdue
    },
    noDeadlinesContainer: {
      padding: 20,
      alignItems: "center",
    },
    noDeadlinesText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // Helper function to format date as DD/MM/YYYY
  const formatDateDDMMYYYY = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerCard}>
          <Text style={styles.welcomeTitle}>Dashboard</Text>
          <Text style={styles.welcomeSubtitle}>
            Welcome back, {getDisplayName(user)}!
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => router.push("/timelogs/form")}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={styles.quickActionLabel}>{"Add Time\nLog"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => router.push("/projects/form")}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons
                  name="folder-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={styles.quickActionLabel}>{"Add\nProject"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => router.push("/locations/form")}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={styles.quickActionLabel}>{"Add\nLocation"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => router.push("/tasks/form")}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={styles.quickActionLabel}>{"Add\nTask"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Task Deadlines Section */}
        <View style={styles.deadlineSection}>
          <Text style={styles.deadlineTitle}>Task Deadlines</Text>

          {/* Overdue Deadlines */}
          {dashboardData.overdueDeadlines.length > 0 ? (
            dashboardData.overdueDeadlines.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[styles.deadlineItem, styles.overdueDeadlineItem]}
                onPress={() => router.push(`/tasks?id=${task.id}`)}
              >
                <Text style={styles.deadlineItemTitle}>{task.title}</Text>
                <Text style={styles.deadlineItemMeta}>
                  {task.description &&
                    `${task.description.substring(0, 50)}${
                      task.description.length > 50 ? "..." : ""
                    } • `}
                  {task.projects && `${task.projects.title} • `}
                  Status: {task.status || "pending"}
                </Text>
                <Text style={styles.deadlineDate}>
                  Overdue: {formatDateDDMMYYYY(task.deadline_at)}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noDeadlinesContainer}>
              <Ionicons
                name="checkmark-circle-outline"
                size={48}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.noDeadlinesText}>No overdue tasks</Text>
            </View>
          )}

          {/* Approaching Deadlines */}
          {dashboardData.approachingDeadlines.length > 0 && (
            <>
              {dashboardData.approachingDeadlines.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.deadlineItem, styles.approachingDeadlineItem]}
                  onPress={() => router.push(`/tasks?id=${task.id}`)}
                >
                  <Text style={styles.deadlineItemTitle}>{task.title}</Text>
                  <Text style={styles.deadlineItemMeta}>
                    {task.description &&
                      `${task.description.substring(0, 50)}${
                        task.description.length > 50 ? "..." : ""
                      } • `}
                    {task.projects && `${task.projects.title} • `}
                    Status: {task.status || "pending"}
                  </Text>
                  <Text style={styles.deadlineDate}>
                    Due: {formatDateDDMMYYYY(task.deadline_at)}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* No deadlines at all */}
          {dashboardData.overdueDeadlines.length === 0 &&
            dashboardData.approachingDeadlines.length === 0 && (
              <View style={styles.noDeadlinesContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={48}
                  color={theme.colors.textSecondary}
                />
                <Text style={styles.noDeadlinesText}>
                  No tasks with deadlines found.{"\n"}Add deadlines to your
                  tasks to see them here.
                </Text>
              </View>
            )}
        </View>

        {/* Daily Goal Progress */}
        <View style={styles.goalSection}>
          <Text style={styles.goalTitle}>Daily Goal</Text>

          <View style={styles.goalProgressWrapper}>
            <View style={styles.goalProgressInfo}>
              <View style={styles.goalTargetContainer}>
                <Text style={styles.goalTargetText}>
                  {formatDurationEnglish(dashboardData.dailyGoal)} per day
                </Text>
                {dashboardData.overtimeHours > 0 && (
                  <View style={styles.overtimeIndicatorBelow}>
                    <Ionicons
                      name="trophy-outline"
                      size={16}
                      color="#D97706"
                      style={styles.overtimeIcon}
                    />
                    <Text style={styles.overtimeText}>
                      +{formatDurationEnglish(dashboardData.overtimeHours)}{" "}
                      overtime
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.goalProgressStats}>
                <Text style={styles.goalProgressPercent}>
                  {dashboardData.goalProgress.toFixed(0)}%
                </Text>
                <Text style={styles.goalStatusText}>
                  {dashboardData.goalStatus === "completed" && "🎉 Complete!"}
                  {dashboardData.goalStatus === "overachieved" &&
                    "🚀 Overachieved!"}
                  {dashboardData.goalStatus === "in-progress" &&
                    `${formatDurationEnglish(
                      dashboardData.remainingTime
                    )} left`}
                  {dashboardData.goalStatus === "not-started" &&
                    "Start logging time"}
                </Text>
              </View>
            </View>

            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${dashboardData.goalProgress}%`,
                    backgroundColor:
                      dashboardData.goalStatus === "completed" ||
                      dashboardData.goalStatus === "overachieved"
                        ? theme.colors.success || "#4CAF50"
                        : dashboardData.goalStatus === "in-progress"
                        ? theme.colors.primary
                        : theme.colors.textSecondary,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Time Tracking Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons
                name="time-outline"
                size={32}
                color={theme.colors.primary}
                style={styles.statIcon}
              />
              <Text style={styles.statValue}>
                {formatDurationEnglish(dashboardData.todayTotal)}
              </Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons
                name="calendar-outline"
                size={32}
                color={theme.colors.primary}
                style={styles.statIcon}
              />
              <Text style={styles.statValue}>
                {formatDurationEnglish(dashboardData.weekTotal)}
              </Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons
                name="calendar-clear-outline"
                size={32}
                color={theme.colors.primary}
                style={styles.statIcon}
              />
              <Text style={styles.statValue}>
                {formatDurationEnglish(dashboardData.monthTotal)}
              </Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons
                name="folder-outline"
                size={32}
                color={theme.colors.primary}
                style={styles.statIcon}
              />
              <Text style={styles.statValue}>
                {dashboardData.totalProjects}
              </Text>
              <Text style={styles.statLabel}>Projects</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons
                name="location-outline"
                size={32}
                color={theme.colors.primary}
                style={styles.statIcon}
              />
              <Text style={styles.statValue}>
                {dashboardData.totalLocations}
              </Text>
              <Text style={styles.statLabel}>Locations</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons
                name="document-text-outline"
                size={32}
                color={theme.colors.primary}
                style={styles.statIcon}
              />
              <Text style={styles.statValue}>
                {dashboardData.totalTimeLogs}
              </Text>
              <Text style={styles.statLabel}>Total Logs</Text>
            </View>
          </View>
        </View>

        {/* Recent Time Logs */}
        {dashboardData.recentLogs.length > 0 && (
          <View style={styles.recentContainer}>
            <Text style={styles.recentTitle}>Recent Activity</Text>
            {dashboardData.recentLogs.map((log) => (
              <View key={log.id} style={styles.recentItem}>
                <Text style={styles.recentItemTitle}>
                  {log.tasks ? log.tasks.title : "Time Log"}
                </Text>
                <Text style={styles.recentItemMeta}>
                  {formatDurationEnglish(log.duration)} •{" "}
                  {formatDate(log.updated_at || log.created_at)}
                  {log.projects && ` • ${log.projects.title}`}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
