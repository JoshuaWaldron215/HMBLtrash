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
  Info,
  Calendar,
  ChevronRight
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
import { queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import type { Pickup, User } from '@shared/schema';

export default function Driver() {
  const [isOnline, setIsOnline] = useState(true);
  const [startingAddress, setStartingAddress] = useState('');
  const [selectedPickups, setSelectedPickups] = useState<number[]>([]);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch 7-day schedule (primary data source)
  const { data: scheduleData = {}, isLoading: routeLoading, error: routeError } = useQuery({
    queryKey: ['/api/driver/route'],
    queryFn: async () => {
      const res = await authenticatedRequest('GET', '/api/driver/route');
      const data = await res.json();
      console.log('🔄 Driver dashboard received schedule data:', data);
      console.log('📋 Available schedule keys:', Object.keys(data));
      console.log('🔍 Raw 2025-07-29 data from server:', JSON.stringify(data['2025-07-29'], null, 2));
      return data;
    },
    retry: false,
  });

  // Fetch full route data for Google Maps integration
  const { data: fullRouteData, refetch: refetchFullRoute } = useQuery({
    queryKey: ['/api/driver/full-route'],
    queryFn: () => authenticatedRequest('GET', '/api/driver/full-route').then(res => res.json()),
    retry: false,
  });

  // Handle new organized-by-date format - fix timezone issue
  // Use Eastern Time (Philadelphia timezone) for consistency
  const today = new Date();
  const easternToday = new Date(today.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const todayDate = `${easternToday.getFullYear()}-${String(easternToday.getMonth() + 1).padStart(2, '0')}-${String(easternToday.getDate()).padStart(2, '0')}`;
  console.log('📅 Driver dashboard - Today\'s date (Eastern):', todayDate);
  console.log('📅 Browser timezone date:', `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
  
  // Get today's data from the schedule
  const todaySchedule = scheduleData[todayDate] || { pickups: [] };
  const todayRoute = todaySchedule.pickups || [];
  console.log('📅 Looking for pickups on date:', todayDate);
  console.log('📦 Found today schedule:', todaySchedule);
  console.log('🚚 Today route pickups:', todayRoute.length);
  console.log('🗂️ Full schedule data keys:', Object.keys(scheduleData));
  console.log('📋 Schedule for 2025-07-29:', scheduleData['2025-07-29']);

  // Get all days from schedule for 7-day view
  const scheduleDays = Object.values(scheduleData).sort((a: any, b: any) => 
    a.date.localeCompare(b.date)
  );

  // Calculate totals from all schedule days for proper summary
  const allPickups = scheduleDays.flatMap((day: any) => day.pickups || []);
  const allPendingPickups = allPickups.filter((p: any) => p.status === 'assigned');
  const allCompletedPickups = allPickups.filter((p: any) => p.status === 'completed');

  // Use ONLY today's route data for today-specific calculations
  const todayPendingPickups = todayRoute.filter((p: any) => p.status === 'assigned');
  const todayCompletedPickups = todayRoute.filter((p: any) => p.status === 'completed');

  // Complete selected pickups mutation using bulk endpoint
  const completePickupsMutation = useMutation({
    mutationFn: async (pickupIds: number[]) => {
      const response = await authenticatedRequest('POST', '/api/driver/complete-bulk', { pickupIds });
      return response.json();
    },
    onSuccess: (data, pickupIds) => {
      queryClient.invalidateQueries({ queryKey: ['/api/driver/route'] });
      queryClient.invalidateQueries({ queryKey: ['/api/driver/full-route'] });
      setSelectedPickups([]); // Clear selections after completion
      
      const subscriptionCount = data.nextWeekPickups?.length || 0;
      toast({
        title: "Pickups Completed",
        description: `Successfully completed ${pickupIds.length} pickup${pickupIds.length > 1 ? 's' : ''}${
          subscriptionCount > 0 ? `. Created ${subscriptionCount} subscription pickup${subscriptionCount > 1 ? 's' : ''} for next week.` : '.'
        }`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete pickups. Please try again.",
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
    const pendingIds = todayPendingPickups.map((p: any) => p.id);
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

        {/* Weekly Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <MobileCard className="text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {allPickups.length}
            </div>
            <div className="text-xs text-muted-foreground">
              Total Stops
            </div>
          </MobileCard>
          <MobileCard className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {allCompletedPickups.length}
            </div>
            <div className="text-xs text-muted-foreground">
              Completed
            </div>
          </MobileCard>
          <MobileCard className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {allPendingPickups.length}
            </div>
            <div className="text-xs text-muted-foreground">
              Remaining
            </div>
          </MobileCard>
        </div>

        {/* Today's Pickups - Primary Focus */}
        {todayRoute.length > 0 ? (
          <MobileCard className="mb-6 border-2 border-primary bg-primary/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                  TODAY
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-primary">Today's Route</h3>
                  <p className="text-sm text-muted-foreground">
                    {todayPendingPickups.length} remaining • {todayCompletedPickups.length} completed
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{todayRoute.length}</div>
                <div className="text-xs text-muted-foreground">stops</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">
                  {todayCompletedPickups.length} of {todayRoute.length} done
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${todayRoute.length > 0 ? (todayCompletedPickups.length / todayRoute.length) * 100 : 0}%` 
                  }}
                />
              </div>
            </div>

            {/* Selection Controls */}
            {todayPendingPickups.length > 0 && (
              <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
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
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  {completePickupsMutation.isPending ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Complete ({selectedPickups.length})
                </Button>
              </div>
            )}

            {/* Today's Pickup List */}
            <div className="space-y-3">
              {todayRoute.map((pickup: any, index: number) => (
                <div 
                  key={pickup.id}
                  className={`p-4 rounded-lg border-2 ${
                    pickup.status === 'completed' 
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                      : selectedPickups.includes(pickup.id)
                        ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header with checkbox, route number, and address */}
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedPickups.includes(pickup.id)}
                        onChange={() => togglePickupSelection(pickup.id)}
                        className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary mt-1"
                        disabled={pickup.status === 'completed'}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                            #{pickup.routeOrder || index + 1}
                          </span>
                          <span className="font-medium text-sm leading-tight">{pickup.address}</span>
                        </div>
                        
                        {/* Pickup details in a grid */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <Package className="w-3 h-3" />
                            <span>{pickup.bagCount} bags</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>ETA: {pickup.estimatedArrival}</span>
                          </span>
                          <span className="font-medium">${parseFloat(pickup.amount?.toString() || '0').toFixed(2)}</span>
                          <div className="flex justify-end">
                            {pickup.status === 'completed' ? (
                              <div className="flex items-center text-green-600">
                                <Check className="w-4 h-4 mr-1" />
                                <span className="text-xs font-medium">Done</span>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleNavigate(pickup.address)}
                                className="text-primary hover:text-primary/80 h-7 px-2 text-xs"
                              >
                                <Navigation className="w-3 h-3 mr-1" />
                                Navigate
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Special instructions if any */}
                    {pickup.specialInstructions && (
                      <p className="text-sm text-amber-700 dark:text-amber-300 p-2 bg-amber-50 dark:bg-amber-900/20 rounded ml-8">
                        Note: {pickup.specialInstructions}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </MobileCard>
        ) : (
          <MobileCard className="text-center py-8 mb-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-lg mb-2">All Done for Today!</h3>
            <p className="text-muted-foreground">
              No more pickups scheduled for today.
            </p>
          </MobileCard>
        )}

        {/* Upcoming Schedule Preview */}
        {scheduleDays.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <span>Upcoming Schedule</span>
            </h3>

            {scheduleDays.filter((day: any) => !day.isToday).map((day: any) => {
              const dayPickups = day.pickups || [];

              return (
                <MobileCard key={day.date} className="border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">
                        {day.isTomorrow ? 'Tomorrow' : day.dayName}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(day.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${dayPickups.length > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                        {dayPickups.length}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {dayPickups.length === 1 ? 'pickup' : 'pickups'}
                      </div>
                    </div>
                  </div>

                  {dayPickups.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {dayPickups.slice(0, 2).map((pickup: any, index: number) => (
                        <div key={pickup.id} className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>{pickup.address}</span>
                          <span>•</span>
                          <span>{pickup.bagCount} bags</span>
                        </div>
                      ))}
                      {dayPickups.length > 2 && (
                        <p className="text-sm text-muted-foreground">
                          + {dayPickups.length - 2} more pickups
                        </p>
                      )}
                    </div>
                  )}
                </MobileCard>
              );
            })}
          </div>
        )}

      </MobileSection>

      {/* Route Optimization Section */}
      <MobileSection>
        <h2 className="text-xl font-semibold mb-4">Route Optimization</h2>
        
        {/* Starting Address Input */}
        <MobileCard className="mb-4">
          <label className="block text-sm font-medium mb-2">Starting Address</label>
          <input
            type="text"
            value={startingAddress}
            onChange={(e) => setStartingAddress(e.target.value)}
            placeholder="Enter your current location (e.g., 1234 Main St, Philadelphia, PA)"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <p className="text-xs text-muted-foreground mt-1">
            This will be your starting point for the optimized route
          </p>
        </MobileCard>

        <div className="grid grid-cols-2 gap-4">
          <MobileButton 
            variant="outline"
            className="flex flex-col items-center space-y-2 h-auto py-4"
            onClick={() => {
              if (todayRoute.length > 0) {
                // Create optimized multi-stop route with all pickup addresses
                const pickupAddresses = todayRoute.map((p: any) => p.address);
                
                if (startingAddress.trim()) {
                  // Create route with starting point and all pickup addresses as waypoints
                  const destination = pickupAddresses[pickupAddresses.length - 1];
                  const waypoints = pickupAddresses.slice(0, -1).join('|');
                  
                  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(startingAddress)}&destination=${encodeURIComponent(destination)}&waypoints=${encodeURIComponent(waypoints)}&travelmode=driving&optimize=true`;
                  
                  console.log('🗺️ Opening optimized route with:', {
                    start: startingAddress,
                    destination,
                    waypoints: waypoints.split('|'),
                    totalStops: pickupAddresses.length + 1
                  });
                  
                  window.open(googleMapsUrl, '_blank');
                } else {
                  // Fallback: route without starting point
                  const destination = pickupAddresses[0];
                  const waypoints = pickupAddresses.slice(1).join('|');
                  
                  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&waypoints=${encodeURIComponent(waypoints)}&travelmode=driving&optimize=true`;
                  
                  window.open(googleMapsUrl, '_blank');
                }
              } else {
                toast({
                  title: "No Route Available",
                  description: "You don't have any pickups scheduled for today.",
                  variant: "destructive",
                });
              }
            }}
            disabled={todayRoute.length === 0}
          >
            <Route className="w-6 h-6" />
            <span>Full Route ({todayRoute.length} stops)</span>
          </MobileButton>
          
          <MobileButton 
            variant="outline"
            className="flex flex-col items-center space-y-2 h-auto py-4"
            onClick={() => {
              // Show estimated route info
              toast({
                title: "Route Info",
                description: `${todayRoute.length} stops • Est. ${Math.round(todayRoute.length * 20)} minutes • ${Math.round(todayRoute.length * 2.5)} miles`,
              });
            }}
          >
            <Navigation className="w-6 h-6" />
            <span>Route Info</span>
          </MobileButton>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <MobileButton 
            variant="outline"
            className="flex flex-col items-center space-y-2 h-auto py-4"
            onClick={() => window.open('tel:+12674014292', '_self')}
          >
            <Phone className="w-6 h-6" />
            <span>Support</span>
          </MobileButton>
          
          <MobileButton 
            variant="outline"
            className="flex flex-col items-center space-y-2 h-auto py-4"
            onClick={() => setLocation('/driver/history')}
          >
            <Star className="w-6 h-6" />
            <span>History</span>
          </MobileButton>
        </div>
      </MobileSection>
    </MobileLayout>
  );
}