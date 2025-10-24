import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Play, Square, Plus, DollarSign, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { DonationModal } from "../components/donation-modal";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Session } from "@shared/schema";

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [isTestSession, setIsTestSession] = useState(false);
  const { toast } = useToast();

  // Fetch active session and total
  const { data: activeSession, isLoading: sessionLoading } = useQuery<Session | null>({
    queryKey: ["/api/session/active"],
  });

  const { data: totalData, isLoading: totalLoading } = useQuery<{ total: number }>({
    queryKey: ["/api/total"],
  });

  const total = totalData?.total ?? 0;
  const hasActiveSession = !!activeSession;

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/session/start", {
        location: location.trim(),
        isTest: isTestSession,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/session/active"] });
      toast({
        title: "Session Started",
        description: `Recording at: ${location}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start session. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Stop session mutation
  const stopSessionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/session/stop", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/session/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/total"] });
      setLocation("");
      setIsTestSession(false);
      toast({
        title: "Session Stopped",
        description: "Session ended successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to stop session. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Product sale mutation
  const productSaleMutation = useMutation({
    mutationFn: async ({ productId, amount }: { productId: string; amount: number }) => {
      return await apiRequest("POST", "/api/transaction/product", {
        sessionId: activeSession?.id,
        amount: amount.toFixed(2),
        productId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/total"] });
      toast({
        title: "Product Sale Recorded",
        description: "Sale added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record product sale.",
        variant: "destructive",
      });
    },
  });

  const handleStartStop = async () => {
    if (hasActiveSession) {
      stopSessionMutation.mutate();
    } else {
      if (!location.trim()) return;
      startSessionMutation.mutate();
    }
  };

  const handleProductSale = async (productId: string, amount: number) => {
    if (!activeSession) return;
    productSaleMutation.mutate({ productId, amount });
  };

  const isProcessing =
    startSessionMutation.isPending ||
    stopSessionMutation.isPending ||
    productSaleMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-4 py-6 space-y-6">
        {/* Total Display - Large and Prominent */}
        <Card className="border-card-border">
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground mb-2">Total Collected</p>
            {totalLoading ? (
              <div className="h-16 flex items-center justify-center">
                <div className="text-4xl font-semibold text-muted-foreground animate-pulse">
                  $0.00
                </div>
              </div>
            ) : (
              <div className="text-5xl md:text-6xl font-semibold text-foreground tracking-tight">
                ${total.toFixed(2)}
              </div>
            )}
            {hasActiveSession && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Session Active{activeSession.isTest ? " (Test)" : ""}</span>
              </div>
            )}
            {hasActiveSession && activeSession.location && (
              <p className="mt-1 text-xs text-muted-foreground">
                Location: {activeSession.location}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Session Controls */}
        <div className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="location" className="text-sm font-medium">
                Location
              </Label>
              <Input
                id="location"
                data-testid="input-location"
                type="text"
                placeholder="Enter location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={hasActiveSession || isProcessing}
                className="mt-1.5 h-11"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border-2 border-dashed border-border bg-muted/20">
              <Label
                htmlFor="test-session"
                className="text-sm font-medium cursor-pointer select-none"
              >
                Test Session Mode
                <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                  Not included in totals
                </span>
              </Label>
              <Switch
                id="test-session"
                data-testid="checkbox-test-session"
                checked={isTestSession}
                onCheckedChange={setIsTestSession}
                disabled={hasActiveSession || isProcessing}
              />
            </div>
          </div>

          <Button
            data-testid={hasActiveSession ? "button-stop-session" : "button-start-session"}
            onClick={handleStartStop}
            disabled={(!hasActiveSession && !location.trim()) || isProcessing}
            className="w-full h-12 text-base font-semibold"
            variant={hasActiveSession ? "destructive" : "default"}
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : hasActiveSession ? (
              <>
                <Square className="w-5 h-5 mr-2" />
                Stop Session
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Start Session
              </>
            )}
          </Button>
        </div>

        {/* Action Buttons */}
        {hasActiveSession && (
          <div className="space-y-4">
            <Button
              data-testid="button-record-donation"
              onClick={() => setIsModalOpen(true)}
              disabled={isProcessing}
              className="w-full h-14 text-base font-semibold"
              variant="default"
            >
              <Plus className="w-5 h-5 mr-2" />
              Record Donation
            </Button>

            {/* Product Buttons */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Quick Sales</p>
              <div className="space-y-2">
                <Button
                  data-testid="button-product-1"
                  onClick={() => handleProductSale("product-100", 1)}
                  disabled={isProcessing}
                  variant="outline"
                  className="w-full h-12 justify-between text-base"
                >
                  <span className="font-semibold">Good Advice</span>
                  <span className="flex items-center text-muted-foreground">
                    <DollarSign className="w-4 h-4" />1.00
                  </span>
                </Button>
                <Button
                  data-testid="button-product-5"
                  onClick={() => handleProductSale("product-500", 5)}
                  disabled={isProcessing}
                  variant="outline"
                  className="w-full h-12 justify-between text-base"
                >
                  <span className="font-semibold">Bad Advice</span>
                  <span className="flex items-center text-muted-foreground">
                    <DollarSign className="w-4 h-4" />5.00
                  </span>
                </Button>
                <Button
                  data-testid="button-product-10"
                  onClick={() => handleProductSale("product-1000", 10)}
                  disabled={isProcessing}
                  variant="outline"
                  className="w-full h-12 justify-between text-base"
                >
                  <span className="font-semibold">Keychain</span>
                  <span className="flex items-center text-muted-foreground">
                    <DollarSign className="w-4 h-4" />10.00
                  </span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasActiveSession && (
          <Card className="border-dashed border-card-border">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Play className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-base font-medium text-foreground mb-1">
                No Active Session
              </p>
              <p className="text-sm text-muted-foreground">
                Enter a location and start a session to begin tracking
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Donation Modal */}
      <DonationModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        sessionId={activeSession?.id}
      />
    </div>
  );
}
