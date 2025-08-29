import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/contexts/ThemeContext";
import { useAuth } from "../../src/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { showToast } from "../../src/utils/toast";

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      showToast("success", "Signed out successfully");
    } catch (error) {
      showToast("error", "Error signing out");
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      padding: 20,
    },
    profileCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    avatarText: {
      fontSize: 32,
      fontWeight: "bold",
      color: theme.colors.onPrimary,
    },
    email: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 8,
    },
    joinDate: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    menuSection: {
      marginTop: 20,
    },
    menuItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    menuItemLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    menuIcon: {
      marginRight: 16,
    },
    menuText: {
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: "500",
    },
    signOutButton: {
      backgroundColor: theme.colors.error,
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      marginTop: 20,
    },
    signOutText: {
      color: theme.colors.onError,
      fontSize: 16,
      fontWeight: "600",
    },
  });

  const getInitials = (email) => {
    return email ? email.charAt(0).toUpperCase() : "U";
  };

  const menuItems = [
    {
      icon: "person-outline",
      title: "Edit Profile",
      onPress: () => showToast("info", "Feature coming soon!"),
    },
    {
      icon: "notifications-outline",
      title: "Notifications",
      onPress: () => showToast("info", "Feature coming soon!"),
    },
    {
      icon: "shield-outline",
      title: "Privacy & Security",
      onPress: () => showToast("info", "Feature coming soon!"),
    },
    {
      icon: "help-circle-outline",
      title: "Help & Support",
      onPress: () => showToast("info", "Feature coming soon!"),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user?.email)}</Text>
          </View>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.joinDate}>
            Member since{" "}
            {new Date(user?.created_at || Date.now()).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons
                    name={item.icon}
                    size={24}
                    color={theme.colors.text}
                  />
                </View>
                <Text style={styles.menuText}>{item.title}</Text>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
