import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Navigation, 
  MapPin, 
  Package, 
  Check, 
  Clock, 
  Truck,
  Route,
  Star,
  Phone,
  MessageSquare,
  MoreHorizontal,
  Play,
  Pause,
  Info
} from 'lucide-react';
import MobileLayout, { 
  MobileCard, 
  MobileButton, 
  MobileSection, 
  StatusBadge 
} from '@/components/mobile-layout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { authenticatedRequest } from '@/lib/auth';
import type { Pickup, User } from '@shared/schema';

export default function Driver() {
  const [isOnline, setIsOnline] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch driver pickups
  const { data: pickups = [] } = useQuery({
    queryKey: ['/api/pickups'],
    queryFn: () => authenticatedRequest('/api/pickups').then(res => res.json() as Promise<Pickup[]>),
  });

  // Fetch today's optimized route
  const { data: todayRoute = [] } = useQuery({
    queryKey: ['/api/driver/route'],
    queryFn: () => authenticatedRequest('/api/driver/route').then(res => res.json()),
  });

  // Complete pickup mutation
  const completePickupMutation = useMutation({
    mutationFn: (pickupId: number) => 
      authenticatedRequest(`/api/pickups/${pickupId}/complete`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pickups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/driver/route'] });
      toast({
        title: "Pickup Completed",
        description: "Great job! The pickup has been marked as completed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete pickup. Please try again.",
        variant: "destructive",
      });
    },
  });

  const pendingPickups = pickups.filter(p => p.status === 'assigned');
  const completedPickups = pickups.filter(p => p.status === 'completed');
  const nextPickup = pendingPickups[0];

  const handleCompletePickup = (pickupId: number) => {
    completePickupMutation.mutate(pickupId);
  };

  const handleNavigate = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://maps.google.com/maps?daddr=${encodedAddress}`, '_blank');
  };

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
    toast({
      title: isOnline ? "You're now offline" : "You're now online",
      description: isOnline ? "You won't receive new pickups" : "You can receive new pickups",
    });
  };

  return (
    <MobileLayout 
      title="Driver Dashboard"
      rightAction={
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleOnlineStatus}
          className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-gray-500'}`}
        >
          {isOnline ? 'Online' : 'Offline'}
        </Button>
      }
    >
      {/* Status Header */}
      <MobileSection className="pt-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              {isOnline ? 'You\'re Online' : 'You\'re Offline'}
            </h1>
            <p className="text-muted-foreground">
              {isOnline ? 'Ready to accept pickups' : 'Tap to go online'}
            </p>
          </div>
          <div className={`w-4 h-4 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
        </div>

        {/* Today's Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <MobileCard className="text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {todayRoute.length}
            </div>
            <div className="text-xs text-muted-foreground">
              Today's Route
            </div>
          </MobileCard>
          <MobileCard className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {completedPickups.length}
            </div>
            <div className="text-xs text-muted-foreground">
              Completed
            </div>
          </MobileCard>
          <MobileCard className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {pendingPickups.length}
            </div>
            <div className="text-xs text-muted-foreground">
              Remaining
            </div>
          </MobileCard>
        </div>

        {/* Next Pickup Card */}
        {nextPickup ? (
          <MobileCard className="mb-6 border-l-4 border-l-primary">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg mb-1">Next Pickup</h3>
                <p className="text-sm text-muted-foreground">
                  {nextPickup.scheduledDate ? 
                    new Date(nextPickup.scheduledDate).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    }) : 
                    'Today'
                  }
                </p>
              </div>
              <StatusBadge status="assigned">
                In Progress
              </StatusBadge>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">{nextPickup.address}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {nextPickup.bagCount} bags • {nextPickup.serviceType}
                  </p>
                </div>
              </div>
              
              {nextPickup.specialInstructions && (
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {nextPickup.specialInstructions}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <MobileButton 
                variant="outline" 
                className="flex-1"
                onClick={() => handleNavigate(nextPickup.address)}
              >
                <Navigation className="w-4 h-4 mr-2" />
                Navigate
              </MobileButton>
              <MobileButton 
                variant="success" 
                className="flex-1"
                onClick={() => handleCompletePickup(nextPickup.id)}
                disabled={completePickupMutation.isPending}
              >
                <Check className="w-4 h-4 mr-2" />
                {completePickupMutation.isPending ? 'Completing...' : 'Complete'}
              </MobileButton>
            </div>
          </MobileCard>
        ) : (
          <MobileCard className="text-center mb-6">
            <div className="py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold mb-2">All Pickups Complete!</h3>
              <p className="text-sm text-muted-foreground">
                Great job! No more pickups for today.
              </p>
            </div>
          </MobileCard>
        )}
      </MobileSection>

      {/* Today's Route */}
      {todayRoute.length > 0 && (
        <MobileSection className="bg-muted/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Today's Route</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary"
              onClick={() => {
                const addresses = todayRoute.map(p => p.address).join('|');
                const encodedAddresses = encodeURIComponent(addresses);
                window.open(`https://maps.google.com/maps?daddr=${encodedAddresses}`, '_blank');
              }}
            >
              <Route className="w-4 h-4 mr-1" />
              View Route
            </Button>
          </div>

          <div className="space-y-3">
            {todayRoute.map((pickup, index) => (
              <MobileCard key={pickup.id} className={`${pickup.status === 'completed' ? 'opacity-60' : ''}`}>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      pickup.status === 'completed' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-primary text-primary-foreground'
                    }`}>
                      {pickup.status === 'completed' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium">{pickup.address}</p>
                      <StatusBadge status={pickup.status as any}>
                        {pickup.status}
                      </StatusBadge>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Package className="w-3 h-3 mr-1" />
                      <span>{pickup.bagCount} bags</span>
                      <span className="mx-2">•</span>
                      <span>{pickup.serviceType}</span>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {pickup.status === 'assigned' && (
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleNavigate(pickup.address)}
                          className="p-2"
                        >
                          <Navigation className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleCompletePickup(pickup.id)}
                          className="p-2 text-green-600"
                          disabled={completePickupMutation.isPending}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </MobileCard>
            ))}
          </div>
        </MobileSection>
      )}

      {/* Quick Actions */}
      <MobileSection>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <MobileButton 
            variant="outline"
            className="flex flex-col items-center space-y-2 h-auto py-4"
            onClick={() => {
              const addresses = todayRoute.map(p => p.address).join('|');
              const encodedAddresses = encodeURIComponent(addresses);
              window.open(`https://maps.google.com/maps?daddr=${encodedAddresses}`, '_blank');
            }}
          >
            <Route className="w-6 h-6" />
            <span>Full Route</span>
          </MobileButton>
          
          <MobileButton 
            variant="outline"
            className="flex flex-col items-center space-y-2 h-auto py-4"
            onClick={toggleOnlineStatus}
          >
            {isOnline ? (
              <>
                <Pause className="w-6 h-6" />
                <span>Go Offline</span>
              </>
            ) : (
              <>
                <Play className="w-6 h-6" />
                <span>Go Online</span>
              </>
            )}
          </MobileButton>
          
          <MobileButton 
            variant="outline"
            className="flex flex-col items-center space-y-2 h-auto py-4"
          >
            <Phone className="w-6 h-6" />
            <span>Support</span>
          </MobileButton>
          
          <MobileButton 
            variant="outline"
            className="flex flex-col items-center space-y-2 h-auto py-4"
          >
            <Star className="w-6 h-6" />
            <span>Earnings</span>
          </MobileButton>
        </div>
      </MobileSection>

      {/* Performance Stats */}
      <MobileSection className="bg-muted/20">
        <h2 className="text-xl font-semibold mb-4">Today's Performance</h2>
        <div className="grid grid-cols-1 gap-4">
          <MobileCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">
                  {todayRoute.length > 0 ? Math.round((completedPickups.length / todayRoute.length) * 100) : 0}%
                </p>
              </div>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <Star className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </MobileCard>
          
          <MobileCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pickups</p>
                <p className="text-2xl font-bold">{todayRoute.length}</p>
              </div>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Package className="w-8 h-8 text-primary" />
              </div>
            </div>
          </MobileCard>
        </div>
      </MobileSection>
    </MobileLayout>
  );
}