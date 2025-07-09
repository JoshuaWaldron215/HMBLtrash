import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Download } from "lucide-react";
import Navbar from "@/components/navbar";
import PickupCard from "@/components/pickup-card";
import { authenticatedRequest, getStoredUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Pickup } from "@shared/schema";

export default function Driver() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const user = getStoredUser();

  const { data: pickups, isLoading } = useQuery({
    queryKey: ['/api/driver/route'],
    queryFn: async () => {
      const response = await authenticatedRequest("GET", "/api/driver/route");
      return response.json();
    },
  });

  const completePickupMutation = useMutation({
    mutationFn: async (pickupId: number) => {
      const response = await authenticatedRequest("PATCH", `/api/pickups/${pickupId}/complete`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/driver/route'] });
      toast({
        title: "Pickup completed",
        description: "The pickup has been marked as completed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Completion failed",
        description: error.message || "Failed to mark pickup as completed.",
        variant: "destructive",
      });
    },
  });

  const handleCompletePickup = (pickupId: number) => {
    completePickupMutation.mutate(pickupId);
  };

  const handleNavigate = (address: string) => {
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(googleMapsUrl, '_blank');
  };

  const completedPickups = pickups?.filter((p: Pickup) => p.status === 'completed') || [];
  const pendingPickups = pickups?.filter((p: Pickup) => p.status === 'assigned') || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-service-background">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-service-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-service-background">
      <Navbar />
      
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-service-text">Today's Route</h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-service-secondary">{user?.username}</span>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </div>
          
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-service-secondary">Pickups Completed</p>
                  <p className="text-xl font-bold text-service-text">
                    {completedPickups.length} / {pickups?.length || 0}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-service-secondary">Estimated Time</p>
                  <p className="text-xl font-bold text-service-text">
                    {pickups?.length ? `${(pickups.length - completedPickups.length) * 30}min` : '0min'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {pickups?.length === 0 ? (
            <Card className="bg-white shadow-sm">
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-semibold text-service-text mb-2">No pickups today</h3>
                <p className="text-service-secondary">Check back later or contact admin for assignments.</p>
              </CardContent>
            </Card>
          ) : (
            pickups?.map((pickup: Pickup, index: number) => (
              <PickupCard
                key={pickup.id}
                pickup={pickup}
                userRole="driver"
                onComplete={() => handleCompletePickup(pickup.id)}
                onNavigate={handleNavigate}
              />
            ))
          )}
        </div>

        {pickups?.length > 0 && (
          <Card className="mt-6 bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-service-text">Route Summary</h3>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-service-text">{pickups?.length || 0}</p>
                  <p className="text-sm text-service-secondary">Total Stops</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-service-text">
                    {pickups?.length ? `${pickups.length * 2}mi` : '0mi'}
                  </p>
                  <p className="text-sm text-service-secondary">Total Distance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
