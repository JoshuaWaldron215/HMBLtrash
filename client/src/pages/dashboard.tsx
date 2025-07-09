import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Package, Clock, Plus } from "lucide-react";
import Navbar from "@/components/navbar";
import BookingModal from "@/components/booking-modal";
import { authenticatedRequest, getStoredUser } from "@/lib/auth";
import { Pickup } from "@shared/schema";

export default function Dashboard() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const user = getStoredUser();

  const { data: pickups, isLoading, refetch } = useQuery({
    queryKey: ['/api/pickups'],
    queryFn: async () => {
      const response = await authenticatedRequest("GET", "/api/pickups");
      return response.json();
    },
  });

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-service-background">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <p className="text-service-text">Please log in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-service-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-service-text mb-2">
            Welcome, {user.username}!
          </h1>
          <p className="text-service-secondary">Manage your trash pickup services</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-service-secondary">Total Pickups</p>
                  <p className="text-2xl font-bold text-service-text">
                    {pickups?.length || 0}
                  </p>
                </div>
                <div className="bg-service-primary/10 p-3 rounded-full">
                  <Package className="h-6 w-6 text-service-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-service-secondary">Pending</p>
                  <p className="text-2xl font-bold text-service-text">
                    {pickups?.filter((p: Pickup) => p.status === 'pending').length || 0}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-service-secondary">Completed</p>
                  <p className="text-2xl font-bold text-service-text">
                    {pickups?.filter((p: Pickup) => p.status === 'completed').length || 0}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Pickups */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold text-service-text">
                Your Pickups
              </CardTitle>
              <Button 
                onClick={() => setIsBookingModalOpen(true)}
                className="bg-service-primary text-white hover:bg-service-accent"
              >
                <Plus className="mr-2 h-4 w-4" />
                Book Pickup
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-service-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-service-secondary">Loading your pickups...</p>
              </div>
            ) : pickups?.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-service-secondary mx-auto mb-4" />
                <p className="text-service-text font-medium mb-2">No pickups scheduled</p>
                <p className="text-service-secondary mb-4">Book your first pickup to get started</p>
                <Button 
                  onClick={() => setIsBookingModalOpen(true)}
                  className="bg-service-primary text-white hover:bg-service-accent"
                >
                  Book Your First Pickup
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {pickups?.map((pickup: Pickup) => (
                  <div key={pickup.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-service-text">
                          {pickup.serviceType === 'subscription' ? 'Weekly Subscription' : 'One-Time Pickup'}
                        </p>
                        <p className="text-sm text-service-secondary">{pickup.address}</p>
                      </div>
                      <Badge className={getStatusColor(pickup.status)}>
                        {pickup.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4 text-sm text-service-secondary">
                        <span>{pickup.bagCount} bags</span>
                        <span>${pickup.amount}</span>
                        <span>{formatDate(pickup.scheduledDate || pickup.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
      />
    </div>
  );
}
