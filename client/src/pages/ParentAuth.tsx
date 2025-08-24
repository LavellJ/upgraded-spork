import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AtmosphericBackground } from "@/components/AtmosphericBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface AuthResponse {
  parent: {
    id: string;
    name: string;
    email: string;
  };
  sessionToken: string;
  message: string;
}

export default function ParentAuth() {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const { toast } = useToast();

  const authMutation = useMutation({
    mutationFn: async (data: any): Promise<AuthResponse> => {
      const endpoint = isLogin ? "/api/parents/login" : "/api/parents/signup";
      const response = await fetch(endpoint, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error('Authentication failed');
      return response.json();
    },
    onSuccess: (response: AuthResponse) => {
      // Store session token and parent info
      localStorage.setItem("parentSessionToken", response.sessionToken);
      localStorage.setItem("parentInfo", JSON.stringify(response.parent));
      
      toast({
        title: "Success!",
        description: response.message,
      });
      
      // Redirect to parent dashboard
      setLocation("/parent/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.error || "Authentication failed",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match",
        variant: "destructive",
      });
      return;
    }

    const submitData = isLogin 
      ? { email: formData.email, password: formData.password }
      : { name: formData.name, email: formData.email, password: formData.password };

    authMutation.mutate(submitData);
  };

  return (
    <>
      <AtmosphericBackground />
      
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-sunset-orange to-warm-orange bg-clip-text text-transparent">
              {isLogin ? "Parent Login" : "Create Parent Account"}
            </CardTitle>
            <p className="text-muted-foreground">
              {isLogin ? "Access your child's learning dashboard" : "Monitor and guide your child's learning journey"}
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    required={!isLogin}
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your full name"
                    data-testid="input-parent-name"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="parent@example.com"
                  data-testid="input-parent-email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                  data-testid="input-parent-password"
                />
              </div>
              
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required={!isLogin}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm your password"
                    data-testid="input-confirm-password"
                  />
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-sunset-orange to-warm-orange hover:opacity-90"
                disabled={authMutation.isPending}
                data-testid="button-submit-auth"
              >
                {authMutation.isPending 
                  ? (isLogin ? "Signing In..." : "Creating Account...") 
                  : (isLogin ? "Sign In" : "Create Account")
                }
              </Button>
              
              <div className="text-center space-y-3">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                  data-testid="toggle-auth-mode"
                >
                  {isLogin 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"
                  }
                </button>
                
                <div className="pt-3 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      // Set demo mode data
                      localStorage.setItem("parentDemoMode", "true");
                      localStorage.setItem("parentInfo", JSON.stringify({
                        id: "demo-parent",
                        name: "Demo Parent",
                        email: "demo@example.com"
                      }));
                      localStorage.setItem("parentSessionToken", "demo-token");
                      setLocation("/parent/dashboard");
                    }}
                    data-testid="button-demo-mode"
                  >
                    Preview Dashboard (Demo Mode)
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Explore all parent features with sample data
                  </p>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      
      {/* Child Access Button */}
      <div className="fixed bottom-4 right-4">
        <Button
          onClick={() => setLocation("/dashboard")}
          variant="outline"
          className="bg-white/90 backdrop-blur-sm"
          data-testid="button-child-access"
        >
          Child Access →
        </Button>
      </div>
    </>
  );
}