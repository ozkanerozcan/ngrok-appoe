import React from "react";
import { Redirect } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { LoadingScreen } from "./ui";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <LoadingScreen
        title="Authenticating..."
        icon="shield-checkmark-outline"
        size="small"
      />
    );
  }

  if (!user) {
    return <Redirect href="/auth" />;
  }

  return children;
}
