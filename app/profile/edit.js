import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
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
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { supabase } from "../../src/lib/supabase";

export default function ProfileEditScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, updateProfile } = useAuth();
  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    avatar_url: null,
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.user_metadata?.full_name || "",
        email: user.email || "",
        avatar_url: user.user_metadata?.avatar_url || null,
      });
    }
  }, [user]);

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant permission to access your photos"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      showToast("error", "Failed to pick image");
    }
  };

  const uploadImage = async (uri) => {
    try {
      setUploading(true);

      // Generate unique filename
      const fileName = `avatar_${user.id}_${Date.now()}.jpg`;

      // Read file as base64 using expo-file-system
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to Uint8Array for Supabase
      const binaryData = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(fileName, binaryData, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (error) {
        // If bucket doesn't exist, show helpful message
        if (error.message.includes("not found")) {
          showToast(
            "error",
            "Storage bucket not configured. Please contact support."
          );
          return;
        }
        throw error;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      // Update form data with new avatar URL (clean URL for storage)
      setFormData((prev) => ({
        ...prev,
        avatar_url: publicUrl,
      }));

      showToast("success", "Profile picture uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      showToast("error", "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      showToast("error", "Please enter your full name");
      return;
    }

    setLoading(true);
    try {
      // Update user metadata in Supabase Auth
      const { data, error } = await updateProfile({
        data: {
          full_name: formData.full_name.trim(),
          avatar_url: formData.avatar_url,
        },
      });

      if (error) {
        // If bucket doesn't exist, show helpful message
        if (error.message.includes("not found")) {
          showToast(
            "error",
            "Storage bucket not configured. Please contact support."
          );
          return;
        }
        throw error;
      }

      showToast("success", "Profile updated successfully");
      router.back();
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast("error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || "U";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
    headerButtonText: {
      fontSize: 16,
      color: theme.colors.primary,
      fontWeight: "600",
    },
    disabledButton: {
      opacity: 0.5,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    avatarSection: {
      alignItems: "center",
      marginBottom: 32,
    },
    avatarContainer: {
      position: "relative",
      marginBottom: 16,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    avatarText: {
      fontSize: 36,
      fontWeight: "bold",
      color: theme.colors.onPrimary,
    },
    editAvatarButton: {
      position: "absolute",
      bottom: 0,
      right: 0,
      backgroundColor: theme.colors.primary,
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 3,
      borderColor: theme.colors.background,
    },
    changePhotoText: {
      fontSize: 16,
      color: theme.colors.primary,
      fontWeight: "500",
    },
    inputGroup: {
      marginBottom: 24,
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    disabledInput: {
      opacity: 0.6,
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      marginTop: 32,
    },
    saveButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: "600",
    },
    statusBarArea: {
      height: 0, // Will be adjusted by SafeAreaView
      backgroundColor: theme.colors.surface,
    },
    loadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 50,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Text style={styles.headerButtonText}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Edit Profile</Text>

        <TouchableOpacity
          style={[styles.headerButton, loading && styles.disabledButton]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.headerButtonText}>
            {loading ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {formData.avatar_url ? (
              <Image
                source={{ uri: `${formData.avatar_url}?t=${Date.now()}` }}
                style={styles.avatarImage}
                resizeMode="cover"
                onError={(error) => {
                  console.error(
                    "Image load error:",
                    error.nativeEvent?.error || "Failed to load image"
                  );
                  // If image fails to load, clear the avatar_url
                  setFormData((prev) => ({ ...prev, avatar_url: null }));
                }}
                onLoad={() => {
                  console.log("Image loaded successfully");
                }}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials(formData.full_name)}
                </Text>
              </View>
            )}

            {uploading && (
              <View style={styles.loadingOverlay}>
                <Ionicons
                  name="cloud-upload-outline"
                  size={24}
                  color={theme.colors.onPrimary}
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={pickImage}
              disabled={uploading}
            >
              <Ionicons
                name="camera-outline"
                size={16}
                color={theme.colors.onPrimary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={pickImage} disabled={uploading}>
            <Text style={styles.changePhotoText}>
              {uploading ? "Uploading..." : "Change Photo"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor={theme.colors.textSecondary}
            value={formData.full_name}
            onChangeText={(text) =>
              setFormData({ ...formData, full_name: text })
            }
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={formData.email}
            editable={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
