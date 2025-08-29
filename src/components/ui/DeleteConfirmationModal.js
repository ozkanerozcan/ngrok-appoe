import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Modal as RNModal } from "react-native";
import Button from "./Button";
import { useTheme } from "../../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

export default function DeleteConfirmationModal({
  visible,
  onClose,
  onConfirm,
  title = "Delete Confirmation",
  message,
  itemTitle,
  itemType = "item",
  loading = false,
}) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    container: {
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      width: "100%",
      maxWidth: 400,
      padding: 24,
      alignItems: "center",
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.error + "20",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    message: {
      fontSize: 16,
      color: theme.colors.text,
      textAlign: "center",
      marginBottom: 8,
      lineHeight: 24,
    },
    itemTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.error,
      textAlign: "center",
      marginBottom: 24,
    },
    buttonsContainer: {
      flexDirection: "row",
      width: "100%",
      gap: 12,
    },
    cancelButton: {
      flex: 1,
    },
    deleteButton: {
      flex: 1,
    },
  });

  const handleConfirm = () => {
    onConfirm();
  };

  const displayMessage =
    message || `Are you sure you want to delete this ${itemType}?`;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="trash-outline"
              size={32}
              color={theme.colors.error}
            />
          </View>

          <Text style={styles.message}>{displayMessage}</Text>

          {itemTitle && (
            <Text
              style={styles.itemTitle}
              numberOfLines={2}
              ellipsizeMode="middle"
            >
              "{itemTitle}"
            </Text>
          )}

          <View style={styles.buttonsContainer}>
            <Button
              title="Cancel"
              onPress={onClose}
              variant="secondary"
              style={styles.cancelButton}
              disabled={loading}
            />
            <Button
              title="Delete"
              onPress={handleConfirm}
              variant="danger"
              style={styles.deleteButton}
              loading={loading}
              disabled={loading}
            />
          </View>
        </View>
      </View>
    </RNModal>
  );
}
