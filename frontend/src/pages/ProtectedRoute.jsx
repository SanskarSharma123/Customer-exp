import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ isAdmin = false }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (isAdmin && !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;