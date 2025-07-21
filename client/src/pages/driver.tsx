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
import type { Pickup, User } from '@shared/schema';

export default function Driver() {
  const [isOnline, setIsOnline] = useState(true);
  const [startingAddress, setStartingAddress] = useState('');
  const [selectedPickups, setSelectedPickups] = useState<number[]>([]);
  const { toast } = useToast();

  // Fetch 7-day schedule (primary data source)
  const { data: scheduleData = {}, isLoading: routeLoading, error: routeError } = useQuery({
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
  
  // Get today's data from the schedule
  const todaySchedule = scheduleData[todayDate] || { pickups: [] };
  const todayRoute = todaySchedule.pickups || [];

  // Get all days from schedule for 7-day view
  const scheduleDays = Object.values(scheduleData).sort((a: any, b: any) => 
    a.date.localeCompare(b.date)
  );

  // Use ONLY today's route data for all calculations to ensure consistency
  const todayPendingPickups = todayRoute.filter((p: any) => p.status === 'assigned');
  const todayCompletedPickups = todayRoute.filter((p: any) => p.status === 'completed');

  // Complete selected pickups mutation
  const completePickupsMutation = useMutation({
    mutationFn: async (pickupIds: number[]) => {
      const results = await Promise.all(
        pickupIds.map(async id => {
          const response = await authenticatedRequest('POST', `/api/pickups/${id}/complete`);
          return response.json();
        })
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

        {/* 7-Day Schedule View */}
        {scheduleDays.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">Weekly Schedule</h3>
              <span className="text-sm text-muted-foreground">
                (Mon-Fri Service)
              </span>
            </div>

            {scheduleDays.map((day: any) => {
              const dayPickups = day.pickups || [];
              const pendingPickups = dayPickups.filter((p: any) => p.status === 'assigned');
              const completedPickups = dayPickups.filter((p: any) => p.status === 'completed');
              const isWeekend = new Date(day.date).getDay() === 0 || new Date(day.date).getDay() === 6;
              
              // Skip weekends since you work Mon-Fri only
              if (isWeekend) return null;

              return (
                <MobileCard key={day.date} className={`${day.isToday ? 'border-2 border-primary bg-primary/5' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h4 className={`font-semibold ${day.isToday ? 'text-primary' : ''}`}>
                          {day.isToday ? 'Today' : day.isTomorrow ? 'Tomorrow' : day.dayName}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(day.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      {day.isToday && (
                        <div className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                          TODAY
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${dayPickups.length > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                        {dayPickups.length}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {dayPickups.length === 1 ? 'pickup' : 'pickups'}
                      </div>
                    </div>
                  </div>

                  {/* Today's Progress Bar */}
                  {day.isToday && dayPickups.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Today's Progress</span>
                        <span className="text-sm text-muted-foreground">
                          {completedPickups.length} of {dayPickups.length} done
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${dayPickups.length > 0 ? (completedPickups.length / dayPickups.length) * 100 : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Pickup List */}
                  {dayPickups.length > 0 ? (
                    <div className="space-y-2">
                      {dayPickups.map((pickup: any, index: number) => (
                        <div 
                          key={pickup.id}
                          className={`p-3 rounded-lg border ${
                            pickup.status === 'completed' 
                              ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                              : 'bg-background border-border'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {day.isToday && (
                                <input
                                  type="checkbox"
                                  checked={selectedPickups.includes(pickup.id)}
                                  onChange={() => togglePickupSelection(pickup.id)}
                                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                  disabled={pickup.status === 'completed'}
                                />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium">#{pickup.routeOrder || index + 1}</span>
                                  <MapPin className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">{pickup.address}</span>
                                </div>
                                <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                                  <span className="flex items-center space-x-1">
                                    <Package className="w-3 h-3" />
                                    <span>{pickup.bagCount} bags</span>
                                  </span>
                                  {pickup.estimatedArrival && (
                                    <span className="flex items-center space-x-1">
                                      <Clock className="w-3 h-3" />
                                      <span>ETA: {pickup.estimatedArrival}</span>
                                    </span>
                                  )}
                                  <span className="font-medium">${parseFloat(pickup.amount?.toString() || '0').toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {pickup.status === 'completed' ? (
                                <Check className="w-5 h-5 text-green-600" />
                              ) : (
                                day.isToday && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleNavigate(pickup.address)}
                                    className="text-primary hover:text-primary/80"
                                  >
                                    <Navigation className="w-4 h-4" />
                                  </Button>
                                )
                              )}
                            </div>
                          </div>
                          {pickup.specialInstructions && (
                            <p className="text-xs text-muted-foreground mt-2 ml-7">
                              Note: {pickup.specialInstructions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No pickups scheduled</p>
                    </div>
                  )}
                </MobileCard>
              );
            })}
          </div>
        ) : (
          <MobileCard className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold text-lg mb-2">No Schedule Available</h3>
            <p className="text-muted-foreground">
              No pickups are currently assigned to you.
            </p>
          </MobileCard>
        )}

        {/* Today's Action Section */}
        {todayRoute.length > 0 && (
          <MobileCard className="mb-6 mt-6">
            <h3 className="font-semibold text-lg mb-4">Today's Actions</h3>

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
              const addresses = todayRoute.map((p: any) => p.address).join('|');
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