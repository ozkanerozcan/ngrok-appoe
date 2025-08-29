import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../src/contexts/AuthContext";
import { useTheme } from "../src/contexts/ThemeContext";
import { showToast } from "../src/utils/toast";
import AuthGuard from "../src/components/AuthGuard";
import { Ionicons } from "@expo/vector-icons";

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth();
  const { theme } = useTheme();

  const handleAuth = async () => {
    if (!email || !password) {
      showToast("error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        showToast("success", "Welcome back!");
      } else {
        const { data } = await signUp(email, password);
        if (data?.user && !data?.session) {
          showToast("info", "Please check your email to confirm your account");
        } else {
          showToast("success", "Account created successfully!");
        }
      }
    } catch (error) {
      showToast("error", error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 20,
    },
    title: {
      fontSize: 32,
      fontWeight: "bold",
      color: theme.colors.text,
      textAlign: "center",
      marginBottom: 40,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      fontSize: 16,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    passwordContainer: {
      position: "relative",
      marginBottom: 16,
    },
    passwordInput: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      paddingRight: 50,
      fontSize: 16,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    passwordToggle: {
      position: "absolute",
      right: 16,
      top: 16,
      padding: 4,
    },
    button: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      marginBottom: 16,
      opacity: loading ? 0.7 : 1,
    },
    buttonText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: "600",
    },
    switchButton: {
      alignItems: "center",
      padding: 16,
    },
    switchText: {
      color: theme.colors.primary,
      fontSize: 16,
    },
  });

  return (
    <AuthGuard>
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Text style={styles.title}>
              {isLogin ? "Welcome Back" : "Create Account"}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={theme.colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor={theme.colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleAuth}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsLogin(!isLogin)}
            >
              <Text style={styles.switchText}>
                {isLogin
                  ? "Don't have an account? Sign Up"
                  : "Already have an account? Sign In"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthGuard>
  );
}
