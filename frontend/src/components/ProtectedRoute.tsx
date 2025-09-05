import { useQuery } from "@tanstack/react-query";
import { getAuthStatus } from "@/lib/api";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const location = useLocation();
  const { data: auth, isLoading, isError } = useQuery({
    queryKey: ["authStatus"],
    queryFn: getAuthStatus,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  if (isError || !auth?.authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
