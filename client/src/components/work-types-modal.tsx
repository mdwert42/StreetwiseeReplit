import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { X, Plus, GripVertical, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { WorkType } from "@shared/schema";

interface WorkTypesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  orgId?: string;
}

export function WorkTypesModal({ open, onOpenChange, userId, orgId }: WorkTypesModalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newWorkTypeName, setNewWorkTypeName] = useState("");
  const [newWorkTypeIcon, setNewWorkTypeIcon] = useState("");
  const { toast } = useToast();

  // For free tier, use a dummy userId (in real app, get from auth context)
  const queryParams = orgId ? `?orgId=${orgId}` : userId ? `?userId=${userId}` : "?userId=free-tier";

  // Fetch work types
  const { data: workTypes = [], isLoading } = useQuery<WorkType[]>({
    queryKey: ["/api/work-types", userId, orgId],
    queryFn: async () => {
      const response = await fetch(`/api/work-types${queryParams}`);
      if (!response.ok) {
        // If no work types yet, return empty array
        if (response.status === 400) return [];
        throw new Error("Failed to fetch work types");
      }
      return response.json();
    },
    enabled: open,
  });

  // Create work type
  const createMutation = useMutation({
    mutationFn: async (data: { name: string; icon?: string }) => {
      return await apiRequest("POST", "/api/work-types", {
        userId: userId || "free-tier",
        orgId,
        name: data.name,
        icon: data.icon || null,
        sortOrder: workTypes.length,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-types"] });
      setNewWorkTypeName("");
      setNewWorkTypeIcon("");
      setIsAdding(false);
      toast({
        title: "Work Type Created",
        description: "Your new work type has been added.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create work type.",
        variant: "destructive",
      });
    },
  });

  // Delete work type
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/work-types/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-types"] });
      toast({
        title: "Work Type Deleted",
        description: "Work type has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete work type.",
        variant: "destructive",
      });
    },
  });

  const handleAdd = () => {
    if (newWorkTypeName.trim()) {
      createMutation.mutate({
        name: newWorkTypeName.trim(),
        icon: newWorkTypeIcon.trim() || undefined,
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this work type?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Manage Work Types</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Configure categories for different types of work
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Work Types List */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Loading...
              </div>
            ) : workTypes.length === 0 && !isAdding ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  No work types yet. Add your first one!
                </p>
              </div>
            ) : (
              workTypes.map((workType) => (
                <div
                  key={workType.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="flex-1 flex items-center gap-2">
                    {workType.icon && (
                      <span className="text-xl">{workType.icon}</span>
                    )}
                    <span className="font-medium">{workType.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(workType.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Add New Form */}
          {isAdding ? (
            <div className="space-y-3 p-4 rounded-lg border-2 border-primary bg-primary/5">
              <div>
                <Label htmlFor="work-type-name" className="text-sm font-medium">
                  Name *
                </Label>
                <Input
                  id="work-type-name"
                  placeholder="e.g., Panhandling, Delivery, etc."
                  value={newWorkTypeName}
                  onChange={(e) => setNewWorkTypeName(e.target.value)}
                  className="mt-1.5"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newWorkTypeName.trim()) {
                      handleAdd();
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="work-type-icon" className="text-sm font-medium">
                  Icon (Optional)
                </Label>
                <Input
                  id="work-type-icon"
                  placeholder="e.g., 💰, 🚚, 🎵"
                  value={newWorkTypeIcon}
                  onChange={(e) => setNewWorkTypeIcon(e.target.value)}
                  className="mt-1.5"
                  maxLength={2}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAdd}
                  disabled={!newWorkTypeName.trim() || createMutation.isPending}
                  className="flex-1"
                >
                  {createMutation.isPending ? "Adding..." : "Add Work Type"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    setNewWorkTypeName("");
                    setNewWorkTypeIcon("");
                  }}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setIsAdding(true)}
              variant="outline"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Work Type
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
