import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AtmosphericBackground } from "@/components/AtmosphericBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UserPlus } from "lucide-react";

interface AddChildFormData {
  name: string;
  ageGroup: string;
}

export default function AddChild() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<AddChildFormData>({
    name: "",
    ageGroup: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get authorization header
  const getAuthHeader = () => {
    const token = localStorage.getItem("parentSessionToken");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  };

  const addChildMutation = useMutation({
    mutationFn: async (data: AddChildFormData): Promise<any> => {
      const headers = {
        "Content-Type": "application/json",
        ...getAuthHeader()
      };
      
      return fetch("/api/parents/children", {
        method: "POST",
        headers,
        body: JSON.stringify(data)
      }).then(res => {
        if (!res.ok) throw new Error('Failed to add child');
        return res.json();
      });
    },
    onSuccess: (newChild: any) => {
      // Invalidate the children list query to refresh the parent dashboard
      queryClient.invalidateQueries({ queryKey: ["/api/parents/children"] });
      
      toast({
        title: "Child Added Successfully!",
        description: `${newChild.name} has been added to your account.`,
      });
      
      // Redirect back to parent dashboard
      setLocation("/parent/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.error || "Failed to add child",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.ageGroup) {
      toast({
        title: "Please complete all fields",
        description: "Both name and age group are required.",
        variant: "destructive",
      });
      return;
    }

    addChildMutation.mutate(formData);
  };

  return (
    <>
      <AtmosphericBackground />
      
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <UserPlus className="w-8 h-8 text-sunset-orange" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-sunset-orange to-warm-orange bg-clip-text text-transparent">
              Add Your Child
            </CardTitle>
            <p className="text-muted-foreground">
              Set up a learning profile for your child
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="childName">Child's Name</Label>
                <Input
                  id="childName"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your child's name"
                  data-testid="input-child-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ageGroup">Age Group</Label>
                <Select 
                  value={formData.ageGroup} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, ageGroup: value }))}
                >
                  <SelectTrigger data-testid="select-age-group">
                    <SelectValue placeholder="Select age group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pre-primary">Pre-Primary (3-5 years)</SelectItem>
                    <SelectItem value="primary">Primary (5-8 years)</SelectItem>
                    <SelectItem value="upper-primary">Upper Primary (8-12 years)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This helps us tailor the learning content to the appropriate level
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/parent/dashboard")}
                  className="flex-1"
                  data-testid="button-cancel"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-sunset-orange to-warm-orange hover:opacity-90"
                  disabled={addChildMutation.isPending}
                  data-testid="button-add-child"
                >
                  {addChildMutation.isPending ? "Adding..." : "Add Child"}
                </Button>
              </div>
            </form>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-blue-600 text-sm">
                  <strong>Getting Started:</strong>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• Your child will start at Level 1</li>
                    <li>• Content adapts to their progress</li>
                    <li>• You can adjust settings anytime</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}