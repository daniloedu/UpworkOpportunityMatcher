import { Button } from "@/components/ui/button";
import { login } from "@/lib/api";
import { Briefcase } from "lucide-react";

const Login = () => {
  const handleLogin = () => {
    login();
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-background">
      <div className="text-center space-y-6">
        <div className="bg-gradient-primary p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
          <Briefcase className="h-12 w-12 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">JobHunter AI</h1>
          <p className="text-muted-foreground mt-2">
            Please authenticate with your Upwork account to continue.
          </p>
        </div>
        <Button onClick={handleLogin} size="lg" className="bg-gradient-primary hover:opacity-90 shadow-elegant">
          Authenticate with Upwork
        </Button>
      </div>
    </div>
  );
};

export default Login;
