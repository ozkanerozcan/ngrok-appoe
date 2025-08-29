import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { router } from "expo-router";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle navigation based on auth state
      if (event === "SIGNED_IN" && session?.user) {
        // Navigate to main app after successful sign in
        router.replace("/(tabs)");
      } else if (event === "SIGNED_OUT") {
        // Navigate to auth screen after sign out
        router.replace("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  };

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      throw error;
    }

    return data;
  };

  const updateProfile = async (updates) => {
    const { data, error } = await supabase.auth.updateUser(updates);

    if (error) {
      throw error;
    }

    return data;
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
