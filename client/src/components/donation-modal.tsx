import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface DonationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId?: string;
}

interface DenominationCount {
  [key: string]: number;
}

const BILL_DENOMINATIONS = [
  { label: "$1", value: 1.0, testId: "button-denom-1" },
  { label: "$5", value: 5.0, testId: "button-denom-5" },
  { label: "$10", value: 10.0, testId: "button-denom-10" },
];

const COIN_DENOMINATIONS = [
  { label: "Quarter", value: 0.25, testId: "button-denom-quarter", shortLabel: "25¢" },
  { label: "Dime", value: 0.1, testId: "button-denom-dime", shortLabel: "10¢" },
  { label: "Nickel", value: 0.05, testId: "button-denom-nickel", shortLabel: "5¢" },
];

export function DonationModal({ open, onOpenChange, sessionId }: DonationModalProps) {
  const [counts, setCounts] = useState<DenominationCount>({});
  const [pennies, setPennies] = useState(0);
  const [pennyInputMode, setPennyInputMode] = useState(false);
  const [pennyInput, setPennyInput] = useState("");
  const { toast } = useToast();

  // Donation mutation
  const donationMutation = useMutation({
    mutationFn: async ({ amount, pennies }: { amount: number; pennies: number }) => {
      return await apiRequest("POST", "/api/transaction/donation", {
        sessionId,
        amount: amount.toFixed(2),
        pennies,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/total"] });
      queryClient.invalidateQueries({ queryKey: ["/api/session/transactions"] });
      // Silent success - no toast
      resetCounts();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record donation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDenominationClick = (value: number) => {
    const key = value.toString();
    setCounts((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + 1,
    }));
  };

  const handlePenniesClick = () => {
    setPennies((prev) => prev + 1);
  };

  const calculateTotal = () => {
    let total = 0;
    Object.entries(counts).forEach(([value, count]) => {
      total += parseFloat(value) * count;
    });
    total += pennies * 0.01;
    return total;
  };

  const resetCounts = () => {
    setCounts({});
    setPennies(0);
    setPennyInputMode(false);
    setPennyInput("");
  };

  const handleDone = async () => {
    const total = calculateTotal();
    if (total > 0 && sessionId) {
      donationMutation.mutate({ amount: total, pennies });
    }
  };

  const handleClose = () => {
    if (!donationMutation.isPending) {
      resetCounts();
      onOpenChange(false);
    }
  };

  const total = calculateTotal();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0"
        data-testid="modal-record-donation"
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Record Donation</DialogTitle>
            <Button
              data-testid="button-close-modal"
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={donationMutation.isPending}
              className="h-8 w-8 -mr-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 space-y-6">
          {/* Bills Section */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Bills</h3>
            <div className="grid grid-cols-3 gap-3">
              {BILL_DENOMINATIONS.map((denom) => (
                <button
                  key={denom.value}
                  data-testid={denom.testId}
                  onClick={() => handleDenominationClick(denom.value)}
                  disabled={donationMutation.isPending}
                  className="relative h-20 rounded-lg border-2 border-border bg-card hover-elevate active-elevate-2 transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-xl font-semibold text-foreground">
                    {denom.label}
                  </span>
                  {counts[denom.value.toString()] > 0 && (
                    <Badge
                      data-testid={`badge-count-${denom.value}`}
                      className="absolute -top-2 -right-2 h-6 min-w-6 px-2 rounded-full bg-primary text-primary-foreground font-semibold text-xs"
                    >
                      {counts[denom.value.toString()]}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Coins Section */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Coins</h3>
            <div className="grid grid-cols-3 gap-2">
              {COIN_DENOMINATIONS.map((denom) => (
                <button
                  key={denom.value}
                  data-testid={denom.testId}
                  onClick={() => handleDenominationClick(denom.value)}
                  disabled={donationMutation.isPending}
                  className="relative h-16 rounded-lg border-2 border-border bg-card hover-elevate active-elevate-2 transition-all flex flex-col items-center justify-center gap-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-base font-semibold text-foreground">
                    {denom.shortLabel}
                  </span>
                  <span className="text-xs text-muted-foreground">{denom.label}</span>
                  {counts[denom.value.toString()] > 0 && (
                    <Badge
                      data-testid={`badge-count-${denom.value}`}
                      className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground font-semibold text-xs"
                    >
                      {counts[denom.value.toString()]}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Pennies Input */}
          <div>
            {pennyInputMode ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter penny count"
                    value={pennyInput}
                    onChange={(e) => setPennyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && pennyInput) {
                        setPennies(parseInt(pennyInput) || 0);
                        setPennyInput("");
                        setPennyInputMode(false);
                      }
                    }}
                    className="flex-1 h-12 text-base"
                    autoFocus
                  />
                  <Button
                    onClick={() => {
                      if (pennyInput) {
                        setPennies(parseInt(pennyInput) || 0);
                        setPennyInput("");
                      }
                      setPennyInputMode(false);
                    }}
                    variant="default"
                    className="h-12 px-6"
                  >
                    Set
                  </Button>
                </div>
                <Button
                  onClick={() => {
                    setPennyInputMode(false);
                    setPennyInput("");
                  }}
                  variant="ghost"
                  className="w-full h-10 text-sm"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  data-testid="button-denom-penny"
                  onClick={handlePenniesClick}
                  disabled={donationMutation.isPending}
                  className="relative flex-1 h-12 rounded-lg border-2 border-dashed border-border bg-muted/30 hover-elevate active-elevate-2 transition-all flex items-center justify-between px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-sm font-medium text-muted-foreground">
                    Pennies
                  </span>
                  {pennies > 0 && (
                    <Badge
                      data-testid="badge-count-penny"
                      variant="secondary"
                      className="h-6 px-2 font-semibold"
                    >
                      {pennies}
                    </Badge>
                  )}
                </button>
                <Button
                  onClick={() => setPennyInputMode(true)}
                  variant="outline"
                  className="h-12 px-4 text-sm"
                  disabled={donationMutation.isPending}
                >
                  Quick Entry
                </Button>
              </div>
            )}
          </div>

          {/* Running Total */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Subtotal</span>
              <span
                data-testid="text-subtotal"
                className="text-2xl font-semibold text-foreground"
              >
                ${total.toFixed(2)}
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                data-testid="button-clear"
                onClick={resetCounts}
                variant="outline"
                className="flex-1 h-12"
                disabled={total === 0 || donationMutation.isPending}
              >
                Clear
              </Button>
              <Button
                data-testid="button-done"
                onClick={handleDone}
                className="flex-1 h-12 font-semibold"
                disabled={total === 0 || donationMutation.isPending}
              >
                {donationMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Done"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
