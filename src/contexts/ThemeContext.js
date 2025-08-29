import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ThemeContext = createContext();

const lightTheme = {
  colors: {
    primary: "#007AFF",
    primaryVariant: "#0056CC",
    secondary: "#5856D6",
    background: "#FFFFFF",
    surface: "#F2F2F7",
    error: "#FF3B30",
    onPrimary: "#FFFFFF",
    onSecondary: "#FFFFFF",
    onBackground: "#000000",
    onSurface: "#000000",
    onError: "#FFFFFF",
    text: "#000000",
    textSecondary: "#8E8E93",
    border: "#E5E5EA",
    notification: "#FF3B30",
  },
};

const darkTheme = {
  colors: {
    primary: "#0A84FF",
    primaryVariant: "#0056CC",
    secondary: "#5E5CE6",
    background: "#000000",
    surface: "#1C1C1E",
    error: "#FF453A",
    onPrimary: "#FFFFFF",
    onSecondary: "#FFFFFF",
    onBackground: "#FFFFFF",
    onSurface: "#FFFFFF",
    onError: "#FFFFFF",
    text: "#FFFFFF",
    textSecondary: "#8E8E93",
    border: "#38383A",
    notification: "#FF453A",
  },
};

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === "dark");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("theme");
      if (savedTheme !== null) {
        setIsDark(savedTheme === "dark");
      } else {
        // Use system preference if no saved preference
        setIsDark(systemColorScheme === "dark");
      }
    } catch (error) {
      console.error("Error loading theme preference:", error);
      setIsDark(systemColorScheme === "dark");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await AsyncStorage.setItem("theme", newTheme ? "dark" : "light");
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  const value = {
    theme,
    isDark,
    toggleTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
