import { Navigate } from "react-router-dom";

// Deprecated page kept only for backward compatibility with legacy/deprecated layouts.
export default function Profile() {
  return <Navigate to="/personal-information" replace />;
}
