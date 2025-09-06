import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { formatDurationEnglish } from "../../utils/duration";

// Helper function to format status
const formatStatus = (status) => {
  if (!status) return "Unknown";
  return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

// Helper function to get status badge style
const getStatusBadgeStyle = (status, theme) => {
  const baseStyle = {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
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

// Helper function to get status text style
const getStatusTextStyle = (status, theme) => {
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

export default function Card({
  title,
  subtitle,
  description,
  onPress,
  onEdit,
  onDelete,
  rightContent,
  topRightContent,
  children,
  style,
  // New metadata props
  id,
  created_by,
  created_at,
  updated_by,
  updated_at,
  project,
  location,
  duration,
  deadline_at,
  status,
  ...props
}) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.text,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
      position: "relative",
    },
    pressable: {
      opacity: 0.7,
    },
    header: {
      marginBottom: 8,
    },
    topRightContainer: {
      alignItems: "flex-end",
      marginBottom: 8,
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    dateContainer: {
      flex: 1,
    },
    durationContainer: {
      flex: 0,
    },
    statusContainer: {
      flex: 0,
    },
    updatedAtTopLeft: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: "500",
    },
    durationBadge: {
      backgroundColor: theme.colors.primary + "20",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      position: "absolute",
      top: 8,
      right: 8,
    },
    durationText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.primary,
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    description: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
    },
    updatedAt: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    updatedAtInActions: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginLeft: 8,
    },
    updatedAtContainer: {
      paddingVertical: 4,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      marginBottom: 8,
      alignSelf: "flex-start",
    },
    updatedAtText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: "500",
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    leftActions: {
      flexDirection: "row",
      alignItems: "center",
    },
    rightActions: {
      flexDirection: "row",
      alignItems: "center",
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginRight: 8,
    },
    editButton: {
      backgroundColor: theme.colors.primary + "20",
    },
    deleteButton: {
      backgroundColor: theme.colors.error + "20",
    },
    actionText: {
      fontSize: 14,
      fontWeight: "500",
      marginLeft: 4,
    },
    editText: {
      color: theme.colors.primary,
    },
    deleteText: {
      color: theme.colors.error,
    },
    rightContent: {
      marginLeft: 12,
    },
    detailsButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginRight: 8,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    detailsText: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.colors.primary,
      marginLeft: 4,
    },
  });

  const CardContent = (
    <View style={[styles.card, style]} {...props}>
      {duration && (
        <View style={styles.durationBadge}>
          <Text style={styles.durationText} numberOfLines={1}>
            {formatDurationEnglish(duration)}
          </Text>
        </View>
      )}
      {status && !duration && (
        <View style={getStatusBadgeStyle(status, theme)}>
          <Text style={getStatusTextStyle(status, theme)} numberOfLines={1}>
            {formatStatus(status)}
          </Text>
        </View>
      )}
      {topRightContent && (
        <View style={styles.topRightContainer}>{topRightContent}</View>
      )}
      <View style={styles.header}>
        {/* Top row: Date left */}
        <View style={styles.topRow}>
          <View style={styles.dateContainer}>
            {updated_at && (
              <Text style={styles.updatedAtTopLeft}>
                {new Date(updated_at).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </Text>
            )}
          </View>
        </View>

        {/* Content below */}
        <View style={styles.content}>
          {title ? (
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
              {title}
            </Text>
          ) : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {description ? (
            <Text
              style={styles.description}
              numberOfLines={3}
              ellipsizeMode="tail"
            >
              {description}
            </Text>
          ) : null}
          {children}
        </View>
      </View>

      <View style={styles.actions}>
        <View style={styles.leftActions}>
          {(created_by ||
            created_at ||
            updated_by ||
            updated_at ||
            project ||
            location ||
            (title && title.length > 50) ||
            (description && description.length > 150)) && (
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => {
                // Check if this is a task (has deadline_at) or time log
                const isTask =
                  deadline_at !== undefined && deadline_at !== null;
                const targetPath = isTask ? "/tasks" : "/details";

                router.push({
                  pathname: targetPath,
                  params: isTask
                    ? { id: id || undefined }
                    : {
                        id: id || undefined,
                        subtitle: subtitle || undefined,
                        description: description || undefined,
                        created_by: created_by
                          ? JSON.stringify(created_by)
                          : undefined,
                        created_at: created_at || undefined,
                        updated_by: updated_by
                          ? JSON.stringify(updated_by)
                          : undefined,
                        updated_at: updated_at || undefined,
                        project: project ? JSON.stringify(project) : undefined,
                        location: location
                          ? JSON.stringify(location)
                          : undefined,
                        duration: duration ? duration.toString() : undefined,
                        deadline_at: deadline_at
                          ? deadline_at.toString()
                          : undefined,
                        status: status || undefined,
                      },
                });
              }}
            >
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={theme.colors.primary}
              />
              <Text style={styles.detailsText}>Details</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.rightActions}>
          {/* Show edit/delete buttons for all items since we're not getting user profile data */}
          {onEdit && (
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={onEdit}
            >
              <Ionicons name="pencil" size={16} color={theme.colors.primary} />
              <Text style={[styles.actionText, styles.editText]}>Edit</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={onDelete}
            >
              <Ionicons name="trash" size={16} color={theme.colors.error} />
              <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
}
