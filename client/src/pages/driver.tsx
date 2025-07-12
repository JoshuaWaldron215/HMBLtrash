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
  const { data: pickups = [], isLoading: pickupsLoading, error: pickupsError } = useQuery({
    queryKey: ['/api/pickups'],
    queryFn: () => authenticatedRequest('GET', '/api/pickups').then(res => res.json() as Promise<Pickup[]>),
    retry: false,
  });

  // Fetch today's optimized route
  const { data: routeData = { pickups: [], summary: {} }, isLoading: routeLoading, error: routeError } = useQuery({
    queryKey: ['/api/driver/route'],
    queryFn: () => authenticatedRequest('GET', '/api/driver/route').then(res => res.json()),
    retry: false,
  });

  const todayRoute = Array.isArray(routeData) ? routeData : routeData.pickups || [];
  const routeSummary = routeData.summary || {};

  // Complete pickup mutation
  const completePickupMutation = useMutation({
    mutationFn: (pickupId: number) => 
      authenticatedRequest('POST', `/api/pickups/${pickupId}/complete`),
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

  // Use todayRoute instead of undefined pickups variable
  const pendingPickups = Array.isArray(todayRoute) ? todayRoute.filter(p => p.status === 'assigned') : [];
  const completedPickups = Array.isArray(todayRoute) ? todayRoute.filter(p => p.status === 'completed') : [];
  
  // Show loading state
  if (pickupsLoading || routeLoading) {
    return (
      <MobileLayout title="Driver Dashboard">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </MobileLayout>
    );
  }

  // Show error state for authentication issues
  if (pickupsError || routeError) {
    return (
      <MobileLayout title="Driver Dashboard">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please log in again to access your driver dashboard.</p>
            <Button onClick={() => window.location.href = '/login'}>
              Go to Login
            </Button>
          </div>
        </div>
      </MobileLayout>
    );
  }
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
              {routeSummary.totalStops || todayRoute.length}
            </div>
            <div className="text-xs text-muted-foreground">
              Total Stops
            </div>
          </MobileCard>
          <MobileCard className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {routeSummary.completed || completedPickups.length}
            </div>
            <div className="text-xs text-muted-foreground">
              Completed
            </div>
          </MobileCard>
          <MobileCard className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {routeSummary.remaining || pendingPickups.length}
            </div>
            <div className="text-xs text-muted-foreground">
              Remaining
            </div>
          </MobileCard>
        </div>

        {/* Route Summary Card */}
        {routeSummary.totalDistance && (
          <MobileCard className="mb-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Route Summary</h3>
              <Route className="w-5 h-5 text-blue-600" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">Total Distance</p>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {routeSummary.totalDistance} miles
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">Est. Time</p>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {Math.floor((routeSummary.estimatedTime || 0) / 60)}h {(routeSummary.estimatedTime || 0) % 60}m
                </p>
              </div>
            </div>
            {routeSummary.googleMapsUrl && (
              <MobileButton 
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                onClick={() => window.open(routeSummary.googleMapsUrl, '_blank')}
              >
                <Navigation className="w-4 h-4 mr-2" />
                Open Full Route in Google Maps
              </MobileButton>
            )}
          </MobileCard>
        )}

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

      {/* Optimized Route View */}
      {todayRoute.length > 0 && (
        <MobileSection className="bg-muted/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Route className="w-5 h-5 mr-2 text-blue-600" />
              Optimized Route ({todayRoute.length} stops)
            </h2>
            <div className="text-sm text-gray-600">
              Est. {Math.floor((routeSummary.estimatedTime || 0) / 60)}h {(routeSummary.estimatedTime || 0) % 60}m
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">
                {todayRoute.filter((p: any) => p.status === 'completed').length} / {todayRoute.length} completed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(todayRoute.filter((p: any) => p.status === 'completed').length / todayRoute.length) * 100}%` 
                }}
              ></div>
            </div>
          </div>

          <div className="space-y-3">
            {todayRoute.map((pickup: any, index: number) => (
              <MobileCard key={pickup.id} className={`border-l-4 ${pickup.status === 'completed' ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-blue-500'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start flex-1">
                    {/* Completion Checkbox */}
                    <div className="flex items-center mr-3">
                      <input
                        type="checkbox"
                        checked={pickup.status === 'completed'}
                        onChange={() => pickup.status !== 'completed' && handleCompletePickup(pickup.id)}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        disabled={completePickupMutation.isPending}
                      />
                      <div className="ml-2 w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                        {pickup.routeOrder || index + 1}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className={`font-medium ${pickup.status === 'completed' ? 'text-green-800 dark:text-green-300' : 'text-gray-900 dark:text-gray-100'}`}>
                        {pickup.address}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-1">
                        <span className="font-medium">{pickup.customerName || 'Customer'}</span> • {pickup.bagCount} bags • {pickup.serviceType}
                      </p>
                      {pickup.estimatedArrival && (
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          ETA: {new Date(pickup.estimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                      {pickup.driveTimeFromPrevious > 0 && (
                        <p className="text-xs text-muted-foreground">
                          🚗 {pickup.driveTimeFromPrevious} min drive • {pickup.distanceFromPrevious?.toFixed(1)} miles
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <StatusBadge 
                    status={pickup.status as any} 
                    className={pickup.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'}
                  >
                    {pickup.status === 'completed' ? 'Complete' : 'Pending'}
                  </StatusBadge>
                </div>
                
                {pickup.specialInstructions && (
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded p-2 mb-3">
                    <div className="flex items-start text-amber-800 dark:text-amber-300 text-sm">
                      <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{pickup.specialInstructions}</span>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 mt-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleNavigate(pickup.address)}
                    className="flex items-center flex-1"
                  >
                    <Navigation className="w-4 h-4 mr-1" />
                    Navigate
                  </Button>
                  
                  {pickup.status !== 'completed' && (
                    <Button 
                      size="sm"
                      onClick={() => handleCompletePickup(pickup.id)}
                      disabled={completePickupMutation.isPending}
                      className="flex items-center bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {completePickupMutation.isPending ? 'Completing...' : 'Complete'}
                    </Button>
                  )}
                </div>
              </MobileCard>
            ))}
            
            {/* Route Summary with Distance Matrix insights */}
            <MobileCard className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
              <div className="text-center">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">Route Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-blue-700 dark:text-blue-400 font-medium">Total Distance</div>
                    <div className="text-blue-600 dark:text-blue-300">{(todayRoute.reduce((acc: number, pickup: any) => acc + (pickup.distanceFromPrevious || 0), 0) + 2).toFixed(1)} miles</div>
                  </div>
                  <div>
                    <div className="text-blue-700 dark:text-blue-400 font-medium">Drive Time</div>
                    <div className="text-blue-600 dark:text-blue-300">{todayRoute.reduce((acc: number, pickup: any) => acc + (pickup.driveTimeFromPrevious || 0), 0)} min</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                  <div className="text-xs text-blue-700 dark:text-blue-400">
                    ⚡ Route optimized by drive time • Ready for Google Maps integration
                  </div>
                </div>
              </div>
            </MobileCard>
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