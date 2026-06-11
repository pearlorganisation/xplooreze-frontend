import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/AuthProvider";
import Loading from "./loading/Loading";
import React from "react";
import {
  clearPostLoginReturnMarkers,
  getPostLoginRedirectPathOrNull,
} from "../utils/aiNoteMakerLoginReturn";

const AntiProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return Loading();
  }

  if (!isLoggedIn) return children;

  // Valid redirect: do not clear here (StrictMode-safe); AiNoteMakerPage clears after landing.
  const returnPath = getPostLoginRedirectPathOrNull();
  if (returnPath) {
    return <Navigate to={returnPath} replace />;
  }

  clearPostLoginReturnMarkers();
  return <Navigate to="/" replace />;
};

export default AntiProtectedRoute;
