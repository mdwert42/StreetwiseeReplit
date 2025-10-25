import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { X, Target, Check } from "lucide-react";

interface GoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTotal: number;
  goal: number | null;
  onSetGoal: (goal: number | null) => void;
}

export function GoalModal({ open, onOpenChange, currentTotal, goal, onSetGoal }: GoalModalProps) {
  const [goalInput, setGoalInput] = useState(goal?.toString() || "");

  const handleSave = () => {
    const amount = parseFloat(goalInput);
    if (!isNaN(amount) && amount > 0) {
      onSetGoal(amount);
      onOpenChange(false);
    }
  };

  const handleClear = () => {
    onSetGoal(null);
    setGoalInput("");
    onOpenChange(false);
  };

  const progress = goal ? Math.min((currentTotal / goal) * 100, 100) : 0;
  const remaining = goal ? Math.max(goal - currentTotal, 0) : 0;
  const isComplete = goal && currentTotal >= goal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Daily Goal</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 -mr-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Goal Display */}
          {goal && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current</span>
                <span className="text-2xl font-semibold text-foreground">
                  ${currentTotal.toFixed(2)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Goal</span>
                <span className="text-2xl font-semibold text-primary">
                  ${goal.toFixed(2)}
                </span>
              </div>

              <div className="space-y-2">
                <Progress value={progress} className="h-3" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{progress.toFixed(0)}% complete</span>
                  {!isComplete && <span>${remaining.toFixed(2)} to go</span>}
                  {isComplete && (
                    <span className="flex items-center gap-1 text-primary font-medium">
                      <Check className="w-3 h-3" />
                      Goal reached!
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Set New Goal */}
          <div className="space-y-3">
            <Label htmlFor="goal-amount" className="text-sm font-medium">
              {goal ? "Update Goal" : "Set Goal Amount"}
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="goal-amount"
                  type="number"
                  inputMode="decimal"
                  placeholder="60.00"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                  }}
                  className="pl-7 h-12 text-base"
                  autoFocus
                />
              </div>
              <Button onClick={handleSave} className="h-12 px-6">
                Set
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {goal 
                ? "Enter a new amount to update your goal"
                : "e.g., $60 for a motel room tonight"
              }
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {goal && (
              <Button
                onClick={handleClear}
                variant="outline"
                className="flex-1"
              >
                Clear Goal
              </Button>
            )}
            <Button
              onClick={() => onOpenChange(false)}
              variant="secondary"
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
