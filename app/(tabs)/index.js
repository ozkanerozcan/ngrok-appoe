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
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      // Load all data in parallel
      const [timeLogs, projects, locations] = await Promise.all([
        timeLogService.getAll(),
        projectService.getAll(),
        locationService.getAll(),
      ]);

      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      // Calculate today's total
      const todayTotal = timeLogs
        .filter((log) => new Date(log.created_at) >= today)
        .reduce((sum, log) => sum + (log.duration || 0), 0);

      // Calculate this week's total
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekTotal = timeLogs
        .filter((log) => new Date(log.created_at) >= weekStart)
        .reduce((sum, log) => sum + (log.duration || 0), 0);

      // Calculate this month's total
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthTotal = timeLogs
        .filter((log) => new Date(log.created_at) >= monthStart)
        .reduce((sum, log) => sum + (log.duration || 0), 0);

      // Calculate average daily time and active days (last 30 days)
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      const recentLogs = timeLogs.filter(
        (log) => new Date(log.created_at) >= thirtyDaysAgo
      );
      const uniqueDays = [
        ...new Set(
          recentLogs.map((log) => new Date(log.created_at).toDateString())
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

      // Get recent logs (last 3)
      const recentLogsList = timeLogs.slice(0, 3);

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
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    quickActionsTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 16,
    },
    quickActionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    quickActionItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
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
    quickActionIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.colors.primary + "10",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    quickActionLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
      textAlign: "center",
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
        <View style={styles.quickActionsContainer}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => router.push("/timelogs/form")}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons
                  name="time-outline"
                  size={28}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={styles.quickActionLabel}>Add Time Log</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => router.push("/projects/form")}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons
                  name="folder-outline"
                  size={28}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={styles.quickActionLabel}>Add Project</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => router.push("/locations/form")}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons
                  name="location-outline"
                  size={28}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={styles.quickActionLabel}>Add Location</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => router.push("/timelogs")}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons
                  name="list-outline"
                  size={28}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={styles.quickActionLabel}>View Logs</Text>
            </TouchableOpacity>
          </View>
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
                <Text style={styles.recentItemTitle}>{log.title}</Text>
                <Text style={styles.recentItemMeta}>
                  {formatDurationEnglish(log.duration)} •{" "}
                  {formatDate(log.created_at)}
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
