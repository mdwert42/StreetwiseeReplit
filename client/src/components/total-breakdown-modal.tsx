import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface TotalBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todayTotal: number;
  weekTotal: number;
  monthTotal: number;
  allTimeTotal: number;
}

export function TotalBreakdownModal({
  open,
  onOpenChange,
  todayTotal,
  weekTotal,
  monthTotal,
  allTimeTotal,
}: TotalBreakdownModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Total Breakdown</DialogTitle>
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

        <div className="space-y-4">
          {/* Today */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-card-border">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Today</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            </div>
            <p className="text-2xl font-semibold text-foreground">${todayTotal.toFixed(2)}</p>
          </div>

          {/* This Week */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-card-border">
            <div>
              <p className="text-sm font-medium text-muted-foreground">This Week</p>
              <p className="text-xs text-muted-foreground mt-0.5">Last 7 days</p>
            </div>
            <p className="text-2xl font-semibold text-foreground">${weekTotal.toFixed(2)}</p>
          </div>

          {/* This Month */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-card-border">
            <div>
              <p className="text-sm font-medium text-muted-foreground">This Month</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date().toLocaleDateString('en-US', { month: 'long' })}
              </p>
            </div>
            <p className="text-2xl font-semibold text-foreground">${monthTotal.toFixed(2)}</p>
          </div>

          {/* All Time */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border-2 border-primary/30">
            <div>
              <p className="text-sm font-semibold text-foreground">All Time</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total earnings</p>
            </div>
            <p className="text-3xl font-bold text-primary">${allTimeTotal.toFixed(2)}</p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Tap total on main screen to view breakdown
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
