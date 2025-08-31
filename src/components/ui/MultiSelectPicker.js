import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

export default function MultiSelectPicker({
  label,
  value = [],
  onValueChange,
  items = [],
  placeholder = "Select options",
  searchable = false,
  error,
  required = false,
  renderItem,
  keyExtractor = (item) => item.id,
  labelExtractor = (item) => item.title || item.name || item.label,
  ...props
}) {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const styles = StyleSheet.create({
    container: {
      marginBottom: 12,
    },
    labelContainer: {
      flexDirection: "row",
      marginBottom: 8,
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.text,
    },
    required: {
      color: theme.colors.error,
      marginLeft: 4,
    },
    picker: {
      borderWidth: 1,
      borderColor: error ? theme.colors.error : theme.colors.border,
      borderRadius: 8,
      padding: 12,
      backgroundColor: theme.colors.background,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 50,
    },
    pickerText: {
      fontSize: 16,
      color: value.length > 0 ? theme.colors.text : theme.colors.textSecondary,
      flex: 1,
    },
    selectedCount: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: "600",
      marginLeft: 8,
    },
    error: {
      marginTop: 4,
      fontSize: 14,
      color: theme.colors.error,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      width: "90%",
      maxHeight: "80%",
      padding: 20,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.text,
    },
    closeButton: {
      padding: 4,
    },
    clearAllButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme.colors.error,
      borderRadius: 6,
      marginRight: 8,
    },
    clearAllButtonText: {
      color: theme.colors.onError,
      fontSize: 14,
      fontWeight: "600",
    },
    searchContainer: {
      marginBottom: 16,
    },
    searchInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
    },
    listContainer: {
      maxHeight: 300,
    },
    item: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    itemText: {
      fontSize: 16,
      color: theme.colors.text,
      flex: 1,
    },
    selectedItem: {
      backgroundColor: theme.colors.primary + "20",
    },
    selectedItemText: {
      color: theme.colors.primary,
      fontWeight: "600",
    },
    checkbox: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderRadius: 4,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 12,
    },
    checkboxSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    checkmark: {
      color: theme.colors.onPrimary,
      fontSize: 14,
      fontWeight: "bold",
    },
    emptyContainer: {
      padding: 20,
      alignItems: "center",
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
  });

  const selectedItems = items.filter((item) =>
    value.includes(keyExtractor(item))
  );
  const displayText =
    selectedItems.length > 0
      ? selectedItems.map((item) => labelExtractor(item)).join(", ")
      : placeholder;

  const filteredItems =
    searchable && searchQuery
      ? items.filter((item) =>
          labelExtractor(item).toLowerCase().includes(searchQuery.toLowerCase())
        )
      : items;

  const handleItemPress = (item) => {
    const itemKey = keyExtractor(item);
    const newValue = value.includes(itemKey)
      ? value.filter((key) => key !== itemKey)
      : [...value, itemKey];
    onValueChange(newValue);
  };

  const handleClearAll = () => {
    onValueChange([]);
    setSearchQuery("");
  };

  const renderDefaultItem = ({ item }) => {
    const isSelected = value.includes(keyExtractor(item));
    return (
      <TouchableOpacity
        style={[styles.item, isSelected && styles.selectedItem]}
        onPress={() => handleItemPress(item)}
      >
        <Text style={[styles.itemText, isSelected && styles.selectedItemText]}>
          {labelExtractor(item)}
        </Text>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.required}>*</Text>}
        </View>
      )}

      <TouchableOpacity
        style={styles.picker}
        onPress={() => setModalVisible(true)}
        {...props}
      >
        <Text style={styles.pickerText} numberOfLines={1}>
          {displayText}
        </Text>
        {value.length > 0 && (
          <Text style={styles.selectedCount}>({value.length})</Text>
        )}
        <Ionicons
          name="chevron-down"
          size={20}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || "Select Options"}</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {value.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearAllButton}
                    onPress={handleClearAll}
                  >
                    <Text style={styles.clearAllButtonText}>Clear All</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {searchable && (
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            )}

            <View style={styles.listContainer}>
              {filteredItems.length > 0 ? (
                <FlatList
                  data={filteredItems}
                  keyExtractor={keyExtractor}
                  renderItem={renderItem || renderDefaultItem}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchQuery ? "No results found" : "No options available"}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
