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
  const [startingAddress, setStartingAddress] = useState('');
  const [selectedPickups, setSelectedPickups] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch today's optimized route (primary data source)
  const { data: routeData = [], isLoading: routeLoading, error: routeError } = useQuery({
    queryKey: ['/api/driver/route'],
    queryFn: () => authenticatedRequest('GET', '/api/driver/route').then(res => res.json()),
    retry: false,
  });

  // Fetch full route data for Google Maps integration
  const { data: fullRouteData, refetch: refetchFullRoute } = useQuery({
    queryKey: ['/api/driver/full-route'],
    queryFn: () => authenticatedRequest('GET', '/api/driver/full-route').then(res => res.json()),
    retry: false,
  });

  // Handle new organized-by-date format
  const todayDate = new Date().toISOString().split('T')[0];
  
  // Get today's route data - this is the primary source of truth
  const todayRoute = Array.isArray(routeData) ? routeData : [];
  const routeSummary = routeData.summary || {};

  // Use ONLY today's route data for all calculations to ensure consistency
  const todayPendingPickups = todayRoute.filter(p => p.status === 'assigned');
  const todayCompletedPickups = todayRoute.filter(p => p.status === 'completed');

  // Complete selected pickups mutation
  const completePickupsMutation = useMutation({
    mutationFn: async (pickupIds: number[]) => {
      const results = await Promise.all(
        pickupIds.map(id => 
          authenticatedRequest('POST', `/api/pickups/${id}/complete`)
        )
      );
      return results;
    },
    onSuccess: (_, pickupIds) => {
      queryClient.invalidateQueries({ queryKey: ['/api/driver/route'] });
      queryClient.invalidateQueries({ queryKey: ['/api/driver/full-route'] });
      setSelectedPickups([]); // Clear selections after completion
      toast({
        title: "Pickups Completed",
        description: `Successfully completed ${pickupIds.length} pickup${pickupIds.length > 1 ? 's' : ''}.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete some pickups. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Selection helper functions
  const togglePickupSelection = (pickupId: number) => {
    setSelectedPickups(prev => 
      prev.includes(pickupId) 
        ? prev.filter(id => id !== pickupId)
        : [...prev, pickupId]
    );
  };

  const selectAllPendingPickups = () => {
    const pendingIds = todayPendingPickups.map(p => p.id);
    setSelectedPickups(pendingIds);
  };

  const clearSelection = () => {
    setSelectedPickups([]);
  };

  const handleCompleteSelected = () => {
    if (selectedPickups.length === 0) return;
    completePickupsMutation.mutate(selectedPickups);
  };
  
  // Show loading state
  if (routeLoading) {
    return (
      <MobileLayout title="Driver Dashboard">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </MobileLayout>
    );
  }

  // Show error state for authentication issues
  if (routeError) {
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
  const nextPickup = todayPendingPickups[0];

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
              Total Stops
            </div>
          </MobileCard>
          <MobileCard className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {todayCompletedPickups.length}
            </div>
            <div className="text-xs text-muted-foreground">
              Completed
            </div>
          </MobileCard>
          <MobileCard className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {todayPendingPickups.length}
            </div>
            <div className="text-xs text-muted-foreground">
              Remaining
            </div>
          </MobileCard>
        </div>

        {/* Today's All Pickups - Main List */}
        {todayRoute.length > 0 ? (
          <MobileCard className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Today's Pickups ({todayRoute.length})</h3>
              <div className="text-sm text-muted-foreground">
                {todayCompletedPickups.length} of {todayRoute.length} done
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round((todayCompletedPickups.length / todayRoute.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(todayCompletedPickups.length / todayRoute.length) * 100}%` 
                  }}
                />
              </div>
            </div>

            {/* Route Summary */}
            <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">Total Distance</p>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {fullRouteData?.totalDistance || `${(todayRoute.length * 2.3).toFixed(2)} miles`}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">Est. Time</p>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {fullRouteData?.estimatedTime || `${todayRoute.length * 18} minutes`}
                </p>
              </div>
            </div>

            {/* Optimized Route Navigation */}
            <div className="space-y-3 mb-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Starting Point</div>
                <div className="text-blue-900 dark:text-blue-100 font-semibold">2500 Knights Rd, Bensalem, PA 19020</div>
              </div>
              
              <MobileButton 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  if (todayRoute.length > 0) {
                    // Create optimized Google Maps URL starting from depot
                    const origin = encodeURIComponent("2500 Knights Rd, Bensalem, PA 19020");
                    const sortedPickups = todayRoute.sort((a: any, b: any) => (a.routeOrder || 0) - (b.routeOrder || 0));
                    const addresses = sortedPickups.map((pickup: any) => encodeURIComponent(pickup.address));
                    const destination = addresses[addresses.length - 1];
                    const waypoints = addresses.slice(0, -1).join('|');
                    
                    let googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
                    if (waypoints) {
                      googleMapsUrl += `&waypoints=${waypoints}`;
                    }
                    googleMapsUrl += '&travelmode=driving';
                    
                    window.open(googleMapsUrl, '_blank');
                  } else {
                    toast({
                      title: "No Route Available",
                      description: "No assigned pickups found to create a route.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <Navigation className="w-4 h-4 mr-2" />
                Open Optimized Route in Google Maps
              </MobileButton>
            </div>

            {/* Selection Controls */}
            {todayPendingPickups.length > 0 && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllPendingPickups}
                    disabled={completePickupsMutation.isPending}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                    disabled={completePickupsMutation.isPending || selectedPickups.length === 0}
                  >
                    Clear
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {selectedPickups.length} selected
                  </span>
                </div>
                <Button
                  onClick={handleCompleteSelected}
                  disabled={selectedPickups.length === 0 || completePickupsMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {completePickupsMutation.isPending ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Complete Selected ({selectedPickups.length})
                </Button>
              </div>
            )}

            {/* Optimized Route List */}
            <div className="space-y-3">
              {todayRoute.sort((a: any, b: any) => (a.routeOrder || 0) - (b.routeOrder || 0)).map((pickup: any, index: number) => (
                <div key={pickup.id} className={`p-4 rounded-lg border-l-4 ${
                  pickup.status === 'completed' 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
                    : 'border-blue-500 bg-white dark:bg-gray-800'
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start flex-1">
                      {/* Stop Number & Selection Checkbox */}
                      <div className="flex items-center mr-3">
                        {pickup.status === 'completed' ? (
                          <div className="w-5 h-5 bg-green-600 text-white rounded flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : (
                          <input
                            type="checkbox"
                            checked={selectedPickups.includes(pickup.id)}
                            onChange={() => togglePickupSelection(pickup.id)}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            disabled={completePickupsMutation.isPending}
                          />
                        )}
                        <div className="ml-2 w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                          {pickup.routeOrder || index + 1}
                        </div>
                      </div>
                      
                      {/* Pickup Details */}
                      <div className="flex-1">
                        <h4 className={`font-medium mb-1 ${
                          pickup.status === 'completed' 
                            ? 'text-green-800 dark:text-green-300' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {pickup.address}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-1">
                          <span className="font-medium">{pickup.customerName || 'Customer'}</span> • 
                          {pickup.bagCount} bags • {pickup.serviceType}
                        </p>
                        
                        {/* Time & Distance Info */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {pickup.estimatedArrival && (
                            <span className="text-blue-600 dark:text-blue-400">
                              ETA: {new Date(pickup.estimatedArrival).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          )}
                          {pickup.driveTimeFromPrevious > 0 && (
                            <span>
                              🚗 {pickup.driveTimeFromPrevious} min • {pickup.distanceFromPrevious?.toFixed(1)} miles
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <StatusBadge 
                      status={pickup.status as any} 
                      className={pickup.status === 'completed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                      }
                    >
                      {pickup.status === 'completed' ? 'Complete' : 'Pending'}
                    </StatusBadge>
                  </div>
                  
                  {/* Special Instructions */}
                  {pickup.specialInstructions && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded p-3 mb-3">
                      <div className="flex items-start text-amber-800 dark:text-amber-300 text-sm">
                        <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{pickup.specialInstructions}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleNavigate(pickup.address)}
                      className="flex items-center flex-1"
                    >
                      <Navigation className="w-4 h-4 mr-1" />
                      Navigate
                    </Button>
                    

                  </div>
                </div>
              ))}
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
                  {todayRoute.length > 0 ? Math.round((todayCompletedPickups.length / todayRoute.length) * 100) : 0}%
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