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

export default function Picker({
  label,
  value,
  onValueChange,
  items = [],
  placeholder = "Select an option",
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
      marginBottom: 16,
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
      borderRadius: 12,
      padding: 16,
      backgroundColor: theme.colors.surface,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 50,
    },
    pickerText: {
      fontSize: 16,
      color: value ? theme.colors.text : theme.colors.textSecondary,
      flex: 1,
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
    },
    itemText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    selectedItem: {
      backgroundColor: theme.colors.primary + "20",
    },
    selectedItemText: {
      color: theme.colors.primary,
      fontWeight: "600",
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

  const selectedItem = items.find((item) => keyExtractor(item) === value);
  const displayText = selectedItem ? labelExtractor(selectedItem) : placeholder;

  const filteredItems =
    searchable && searchQuery
      ? items.filter((item) =>
          labelExtractor(item).toLowerCase().includes(searchQuery.toLowerCase())
        )
      : items;

  const handleItemPress = (item) => {
    onValueChange(keyExtractor(item));
    setModalVisible(false);
    setSearchQuery("");
  };

  const renderDefaultItem = ({ item }) => {
    const isSelected = keyExtractor(item) === value;
    return (
      <TouchableOpacity
        style={[styles.item, isSelected && styles.selectedItem]}
        onPress={() => handleItemPress(item)}
      >
        <Text style={[styles.itemText, isSelected && styles.selectedItemText]}>
          {labelExtractor(item)}
        </Text>
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
        <Text style={styles.pickerText}>{displayText}</Text>
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
              <Text style={styles.modalTitle}>{label || "Select Option"}</Text>
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
