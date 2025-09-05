import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const authStatus = searchParams.get("auth_status");
    if (authStatus === "success") {
      queryClient.invalidateQueries({ queryKey: ["authStatus"] });
      navigate("/", { replace: true });
    } else {
      // Handle failure case
      navigate("/login", { replace: true });
    }
  }, [searchParams, navigate, queryClient]);

  return (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="h-16 w-16 animate-spin" />
      <p className="ml-4">Authenticating...</p>
    </div>
  );
};

export default AuthCallback;
