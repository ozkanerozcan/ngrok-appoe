import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/contexts/ThemeContext";
import { useAuth } from "../../src/contexts/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { showToast } from "../../src/utils/toast";

export default function ProfileScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  const getInitials = (name) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || "U";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getDisplayName = (user) => {
    // Use full_name from metadata if available, otherwise derive from email
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    return user?.email ? user.email.split("@")[0] : "User";
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      showToast("success", "Signed out successfully");
      // Navigation is handled automatically by AuthContext
    } catch (error) {
      console.error("Error signing out:", error);
      showToast("error", "Failed to sign out");
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      paddingTop: Math.max(insets.top, 16),
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.text,
    },
    headerButton: {
      padding: 8,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    profileSection: {
      alignItems: "center",
      marginBottom: 40,
    },
    avatarContainer: {
      marginBottom: 20,
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarImage: {
      width: 120,
      height: 120,
      borderRadius: 60,
    },
    avatarText: {
      fontSize: 48,
      fontWeight: "bold",
      color: theme.colors.onPrimary,
    },
    profileName: {
      fontSize: 24,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 8,
    },
    profileEmail: {
      fontSize: 16,
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
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    menuItemContent: {
      flex: 1,
      marginLeft: 16,
    },
    menuItemTitle: {
      fontSize: 16,
      fontWeight: "500",
      color: theme.colors.text,
    },
    menuItemDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    signOutButton: {
      backgroundColor: theme.colors.error,
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      marginTop: 40,
    },
    signOutButtonText: {
      color: theme.colors.onError,
      fontSize: 16,
      fontWeight: "600",
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={theme.colors.primary}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Profile</Text>

        <View style={styles.headerButton} />
      </View>

      <View style={styles.content}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {user?.user_metadata?.avatar_url ? (
              <Image
                source={{
                  uri: `${user.user_metadata.avatar_url}?t=${Date.now()}`,
                }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials(user?.user_metadata?.full_name)}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.profileName}>{getDisplayName(user)}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/profile/edit")}
          >
            <Ionicons
              name="person-outline"
              size={24}
              color={theme.colors.primary}
            />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Edit Profile</Text>
              <Text style={styles.menuItemDescription}>
                Update your name and profile picture
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
