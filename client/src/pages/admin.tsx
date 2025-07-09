import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Truck, DollarSign, UserPlus } from "lucide-react";
import Navbar from "@/components/navbar";
import PickupCard from "@/components/pickup-card";
import { authenticatedRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Pickup, User } from "@shared/schema";

export default function Admin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await authenticatedRequest("GET", "/api/admin/stats");
      return response.json();
    },
  });

  const { data: pickups, isLoading: pickupsLoading } = useQuery({
    queryKey: ['/api/pickups'],
    queryFn: async () => {
      const response = await authenticatedRequest("GET", "/api/pickups");
      return response.json();
    },
  });

  const { data: drivers, isLoading: driversLoading } = useQuery({
    queryKey: ['/api/admin/drivers'],
    queryFn: async () => {
      const response = await authenticatedRequest("GET", "/api/admin/drivers");
      return response.json();
    },
  });

  const assignPickupMutation = useMutation({
    mutationFn: async ({ pickupId, driverId }: { pickupId: number; driverId: number }) => {
      const response = await authenticatedRequest("PATCH", `/api/pickups/${pickupId}/assign`, {
        driverId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pickups'] });
      toast({
        title: "Pickup assigned",
        description: "The pickup has been assigned to the driver.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Assignment failed",
        description: error.message || "Failed to assign pickup to driver.",
        variant: "destructive",
      });
    },
  });

  const handleAssignPickup = (pickupId: number, driverId: number) => {
    assignPickupMutation.mutate({ pickupId, driverId });
  };

  if (statsLoading || pickupsLoading || driversLoading) {
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-service-text mb-2">Admin Dashboard</h1>
          <p className="text-service-secondary">Manage pickups, drivers, and customers</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-service-secondary">Total Subscribers</p>
                  <p className="text-2xl font-bold text-service-text">{stats?.totalSubscribers || 0}</p>
                </div>
                <div className="bg-service-primary/10 p-3 rounded-full">
                  <Users className="h-6 w-6 text-service-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-service-secondary">Today's Pickups</p>
                  <p className="text-2xl font-bold text-service-text">{stats?.todayPickups || 0}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-service-secondary">Active Drivers</p>
                  <p className="text-2xl font-bold text-service-text">{stats?.activeDrivers || 0}</p>
                </div>
                <div className="bg-service-accent/10 p-3 rounded-full">
                  <Truck className="h-6 w-6 text-service-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-service-secondary">Pending Pickups</p>
                  <p className="text-2xl font-bold text-service-text">{stats?.pendingPickups || 0}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pickup Requests */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold text-service-text">
                  Pickup Requests
                </CardTitle>
                <Button variant="outline" size="sm">
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pickups?.length === 0 ? (
                  <p className="text-center py-8 text-service-secondary">No pickup requests</p>
                ) : (
                  pickups?.map((pickup: Pickup) => (
                    <PickupCard
                      key={pickup.id}
                      pickup={pickup}
                      userRole="admin"
                      drivers={drivers}
                      onAssign={(driverId) => handleAssignPickup(pickup.id, driverId)}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Driver Management */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-service-text">
                Driver Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {drivers?.length === 0 ? (
                  <p className="text-center py-8 text-service-secondary">No drivers registered</p>
                ) : (
                  drivers?.map((driver: User) => (
                    <div key={driver.id} className="flex items-center justify-between p-4 bg-service-background rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-service-text">{driver.username}</p>
                          <p className="text-sm text-service-secondary">{driver.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          Active
                        </span>
                        <Button variant="outline" size="sm">
                          <Calendar className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
