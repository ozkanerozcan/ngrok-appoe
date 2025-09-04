import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";

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
    },
    pressable: {
      opacity: 0.7,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 8,
    },
    topRightContainer: {
      alignItems: "flex-end",
      marginBottom: 8,
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
      {topRightContent && (
        <View style={styles.topRightContainer}>{topRightContent}</View>
      )}
      <View style={styles.header}>
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
        {rightContent && (
          <View style={styles.rightContent}>{rightContent}</View>
        )}
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
                        title: title || undefined,
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
