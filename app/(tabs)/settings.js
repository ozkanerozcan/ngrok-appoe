import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/contexts/ThemeContext";
import { useAuth } from "../../src/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { showToast } from "../../src/utils/toast";

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();
  const { user } = useAuth();

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
    scrollContainer: {
      paddingHorizontal: 20,
      paddingTop: 0,
      paddingBottom: 20,
    },
    profileSection: {
      marginBottom: 24,
    },
    profileCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    profileAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    profileAvatarText: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.colors.onPrimary,
    },
    profileAvatarImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 4,
    },
    profileEmail: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    profileArrow: {
      marginLeft: 8,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 12,
    },
    settingItem: {
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
    settingLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    settingIcon: {
      marginRight: 16,
    },
    settingContent: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: "500",
      color: theme.colors.text,
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    switch: {
      marginLeft: 12,
    },
    aboutCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginTop: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    appName: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.colors.text,
      textAlign: "center",
      marginBottom: 8,
    },
    version: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: "center",
      marginBottom: 16,
    },
    description: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
  });

  const appearanceSettings = [
    {
      icon: "moon-outline",
      title: "Dark Mode",
      description: "Toggle between light and dark themes",
      type: "switch",
      value: isDark,
      onPress: toggleTheme,
    },
  ];

  const getInitials = (email) => {
    return email ? email.charAt(0).toUpperCase() : "U";
  };

  const getDisplayName = (user) => {
    // Use full_name from metadata if available, otherwise derive from email
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    return user?.email ? user.email.split("@")[0] : "User";
  };

  const generalSettings = [
    {
      icon: "notifications-outline",
      title: "Push Notifications",
      description: "Receive notifications about updates",
      type: "switch",
      value: true,
      onPress: () => showToast("info", "Notification settings coming soon!"),
    },
    {
      icon: "language-outline",
      title: "Language",
      description: "English (US)",
      type: "arrow",
      onPress: () => showToast("info", "Language settings coming soon!"),
    },
    {
      icon: "download-outline",
      title: "Auto Updates",
      description: "Automatically download app updates",
      type: "switch",
      value: true,
      onPress: () => showToast("info", "Auto update settings coming soon!"),
    },
  ];

  const supportSettings = [
    {
      icon: "help-circle-outline",
      title: "Help Center",
      description: "Get help and support",
      type: "arrow",
      onPress: () => showToast("info", "Help center coming soon!"),
    },
    {
      icon: "mail-outline",
      title: "Contact Us",
      description: "Send feedback or report issues",
      type: "arrow",
      onPress: () => showToast("info", "Contact form coming soon!"),
    },
    {
      icon: "star-outline",
      title: "Rate App",
      description: "Rate us on the app store",
      type: "arrow",
      onPress: () => showToast("info", "Rating feature coming soon!"),
    },
  ];

  const renderSettingItem = (item, index) => (
    <TouchableOpacity
      key={index}
      style={styles.settingItem}
      onPress={item.onPress}
      disabled={item.type === "switch"}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={item.icon} size={24} color={theme.colors.text} />
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          <Text style={styles.settingDescription}>{item.description}</Text>
        </View>
      </View>
      {item.type === "switch" ? (
        <Switch
          style={styles.switch}
          value={item.value}
          onValueChange={item.onPress}
          trackColor={{
            false: theme.colors.border,
            true: theme.colors.primary,
          }}
          thumbColor={theme.colors.surface}
        />
      ) : (
        <Ionicons
          name="chevron-forward-outline"
          size={20}
          color={theme.colors.textSecondary}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* iOS-style Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.profileCard}
            onPress={() => router.push("/profile")}
          >
            <View style={styles.profileAvatar}>
              {user?.user_metadata?.avatar_url ? (
                <Image
                  source={{
                    uri: `${user.user_metadata.avatar_url}?t=${Date.now()}`,
                  }}
                  style={styles.profileAvatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.profileAvatarText}>
                  {getInitials(user?.email)}
                </Text>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{getDisplayName(user)}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
            <Ionicons
              name="chevron-forward-outline"
              size={20}
              color={theme.colors.textSecondary}
              style={styles.profileArrow}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          {appearanceSettings.map(renderSettingItem)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          {generalSettings.map(renderSettingItem)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          {supportSettings.map(renderSettingItem)}
        </View>

        <View style={styles.aboutCard}>
          <Text style={styles.appName}>AppOE</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.description}>
            A modern React Native Expo application with Supabase integration,
            dark mode support, and PWA capabilities. Built for both mobile and
            web platforms.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
