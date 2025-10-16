import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}
