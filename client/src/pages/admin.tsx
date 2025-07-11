import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  Users, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  MapPin,
  Clock,
  Filter,
  Search,
  MoreVertical,
  UserPlus,
  Truck,
  CheckCircle,
  AlertCircle,
  Settings,
  Download,
  RefreshCw,
  Navigation
} from 'lucide-react';
import MobileLayout, { 
  MobileCard, 
  MobileButton, 
  MobileSection, 
  StatusBadge 
} from '@/components/mobile-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { authenticatedRequest } from '@/lib/auth';
import type { Pickup, User, Subscription } from '@shared/schema';

export default function Admin() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  
  // Determine which section to show based on route
  const getCurrentSection = () => {
    if (location === '/admin/subscribers') return 'subscribers';
    if (location === '/admin/requests') return 'requests';  
    if (location === '/admin/routes') return 'routes';
    if (location === '/admin/drivers') return 'drivers';
    if (location === '/admin/reports') return 'reports';
    if (location === '/admin/settings') return 'settings';
    return 'dashboard'; // default
  };
  
  const currentSection = getCurrentSection();

  // Render specific section based on route
  const renderSectionContent = () => {
    switch (currentSection) {
      case 'subscribers':
        return renderSubscribersSection();
      case 'requests':
        return renderRequestsSection();
      case 'routes':
        return renderRoutesSection();
      case 'drivers':
        return renderDriversSection();
      case 'reports':
        return renderReportsSection();
      case 'settings':
        return renderSettingsSection();
      default:
        return renderDashboardContent();
    }
  };

  // Fetch all data
  const { data: pickups = [] } = useQuery({
    queryKey: ['/api/admin/pickups'],
    queryFn: () => authenticatedRequest('/api/admin/pickups').then(res => res.json() as Promise<Pickup[]>),
  });

  const { data: usersData = { customers: [], drivers: [], admins: [] } } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: () => authenticatedRequest('/api/admin/users').then(res => res.json()),
  });

  // Extract users from the response structure
  const allUsers = [
    ...(usersData.customers || []),
    ...(usersData.drivers || []),
    ...(usersData.admins || [])
  ];
  const users = allUsers;

  // Role change mutation
  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) => 
      authenticatedRequest(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Role Updated",
        description: "User role has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Route optimization mutation
  const optimizeRouteMutation = useMutation({
    mutationFn: async (routeType: 'subscription' | 'package') => {
      const endpoint = routeType === 'subscription' 
        ? '/api/admin/optimize-subscription-route' 
        : '/api/admin/optimize-package-route';
      
      const response = await authenticatedRequest(endpoint, {
        method: 'POST',
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pickups'] });
      toast({
        title: "Route Optimized",
        description: `${data.type === 'subscription' ? 'Subscription' : 'Package'} route has been optimized successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Optimization Failed",
        description: error.message || "Failed to optimize route. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleOptimizeRoute = (routeType: 'subscription' | 'package') => {
    optimizeRouteMutation.mutate(routeType);
  };

  // Demo data creation mutation
  const createDemoMutation = useMutation({
    mutationFn: async () => {
      const response = await authenticatedRequest('/api/admin/create-demo-data', {
        method: 'POST',
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pickups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscriptions'] });
      toast({
        title: "Demo Data Created",
        description: `Created ${data.data.customers} customers, ${data.data.subscriptions} subscriptions, and ${data.data.pickups} pickups across Philadelphia Metro Area.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Demo Creation Failed",
        description: error.message || "Failed to create demo data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateDemoData = () => {
    createDemoMutation.mutate();
  };

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['/api/admin/subscriptions'],
    queryFn: () => authenticatedRequest('/api/admin/subscriptions').then(res => res.json() as Promise<Subscription[]>),
  });

  // Assign pickup mutation
  const assignPickupMutation = useMutation({
    mutationFn: ({ pickupId, driverId }: { pickupId: number; driverId: number }) => 
      authenticatedRequest(`/api/admin/pickups/${pickupId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ driverId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pickups'] });
      toast({
        title: "Pickup Assigned",
        description: "The pickup has been assigned to the driver successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign pickup. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate metrics
  const customers = users.filter(u => u.role === 'customer');
  const drivers = users.filter(u => u.role === 'driver');
  const totalRevenue = pickups.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingPickups = pickups.filter(p => p.status === 'pending');
  const completedPickups = pickups.filter(p => p.status === 'completed');
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');

  // Filter pickups for one-time requests
  const oneTimePickups = pickups.filter(p => p.serviceType !== 'subscription');
  const filteredPickups = oneTimePickups.filter(pickup => {
    const matchesServiceType = statusFilter === 'all' || pickup.serviceType === statusFilter;
    return matchesServiceType;
  });

  const handleAssignPickup = (pickupId: number, driverId: number) => {
    assignPickupMutation.mutate({ pickupId, driverId });
  };

  // Section rendering functions
  const renderSubscribersSection = () => (
    <MobileSection className="bg-muted/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Active Subscribers</h2>
        <Button variant="ghost" size="sm" className="text-primary">
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      {activeSubscriptions.length > 0 ? (
        <div className="space-y-3">
          {activeSubscriptions.map((subscription) => {
            const customer = users.find(u => u.id === subscription.customerId);
            return (
              <MobileCard key={subscription.id}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{customer?.username || 'Unknown'}</span>
                      <StatusBadge status="completed">Active</StatusBadge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ${subscription.pricePerMonth}/month • {subscription.frequency} pickup
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {customer?.address || 'No address'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">$20/month</div>
                    <div className="text-xs text-muted-foreground">{subscription.bagCountLimit} bags</div>
                  </div>
                </div>
              </MobileCard>
            );
          })}
        </div>
      ) : (
        <MobileCard className="text-center py-8">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No Active Subscriptions</h3>
          <p className="text-sm text-muted-foreground mb-3">Subscribers will appear here when they sign up for $20/month service</p>
          <div className="text-xs text-muted-foreground">
            Debug: Found {subscriptions.length} total subscriptions, {activeSubscriptions.length} active
          </div>
        </MobileCard>
      )}
    </MobileSection>
  );

  const renderRequestsSection = () => (
    <MobileSection className="bg-muted/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">One-Time Requests</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="text-orange-600">
            Same-Day ({pendingPickups.filter(p => p.serviceType === 'same-day').length})
          </Button>
          <Button variant="ghost" size="sm" className="text-blue-600">
            Next-Day ({pendingPickups.filter(p => p.serviceType === 'next-day').length})
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Button 
          variant={statusFilter === 'same-day' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setStatusFilter('same-day')}
          className="flex-1"
        >
          Same-Day ($25-35)
        </Button>
        <Button 
          variant={statusFilter === 'next-day' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setStatusFilter('next-day')}
          className="flex-1"
        >
          Next-Day ($10-15)
        </Button>
        <Button 
          variant={statusFilter === 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setStatusFilter('all')}
          className="flex-1"
        >
          All
        </Button>
      </div>

      <div className="space-y-3">
        {filteredPickups.length > 0 ? (
          filteredPickups.slice(0, 10).map((pickup) => {
            const customer = users.find(u => u.id === pickup.customerId);
            const isUrgent = pickup.serviceType === 'same-day';
            
            return (
              <MobileCard key={pickup.id} className={isUrgent ? 'border-orange-200 bg-orange-50 dark:bg-orange-900/10' : ''}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">#{pickup.id}</span>
                      <StatusBadge status={pickup.status as any}>{pickup.status}</StatusBadge>
                      {isUrgent && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">URGENT</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <MapPin className="w-3 h-3 text-muted-foreground mr-1" />
                        <span className="truncate">{pickup.address}</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Package className="w-3 h-3 mr-1" />
                        <span>{pickup.bagCount} bags • {customer?.username || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${isUrgent ? 'text-orange-600' : 'text-blue-600'}`}>
                      ${pickup.amount}
                    </span>
                    <div className="text-xs text-muted-foreground">
                      {pickup.serviceType === 'same-day' ? '$25-35' : '$10-15'}
                    </div>
                  </div>
                </div>
                
                {pickup.status === 'pending' && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground pt-3 border-t">
                    <span>Assign to:</span>
                    {drivers.map((driver) => (
                      <Button
                        key={driver.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAssignPickup(pickup.id, driver.id)}
                        className="text-xs px-2 py-1 h-6"
                      >
                        {driver.username}
                      </Button>
                    ))}
                  </div>
                )}
              </MobileCard>
            );
          })
        ) : (
          <MobileCard className="text-center py-8">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No One-Time Requests</h3>
            <p className="text-sm text-muted-foreground">
              {statusFilter === 'all' ? 'Package requests will appear here' : `No ${statusFilter} requests pending`}
            </p>
          </MobileCard>
        )}
      </div>
    </MobileSection>
  );

  const renderRoutesSection = () => (
    <MobileSection>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Route Optimization</h2>
      </div>
      
      {/* Route Optimization Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <MobileCard className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <div className="text-center">
            <Calendar className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <h3 className="font-semibold mb-2">Subscription Route</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Optimize weekly customers for reliable income
            </p>
            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => optimizeRouteMutation.mutate('subscription')}
              disabled={optimizeRouteMutation.isPending}
            >
              {optimizeRouteMutation.isPending ? 'Optimizing...' : 'Optimize Subscription Route'}
            </Button>
          </div>
        </MobileCard>
        
        <MobileCard className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <div className="text-center">
            <Package className="w-8 h-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
            <h3 className="font-semibold mb-2">Package Route</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Optimize same-day and next-day requests
            </p>
            <Button 
              className="w-full bg-orange-600 hover:bg-orange-700"
              onClick={() => optimizeRouteMutation.mutate('package')}
              disabled={optimizeRouteMutation.isPending}
            >
              {optimizeRouteMutation.isPending ? 'Optimizing...' : 'Optimize Package Route'}
            </Button>
          </div>
        </MobileCard>
      </div>

      {/* Current Route Display */}
      {pickups.filter(p => p.status === 'assigned').length > 0 && (
        <MobileCard className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Current Optimized Route</h3>
            <Button variant="ghost" size="sm" className="text-blue-600">
              <Navigation className="w-4 h-4 mr-1" />
              Open in Maps
            </Button>
          </div>
          
          <div className="space-y-3">
            {pickups
              .filter(p => p.status === 'assigned')
              .sort((a, b) => (a.routeOrder || 0) - (b.routeOrder || 0))
              .map((pickup, index) => {
                const customer = users.find(u => u.id === pickup.customerId);
                
                return (
                  <div key={pickup.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm mb-1">
                        {customer?.username || 'Unknown Customer'}
                      </div>
                      <div className="text-sm text-muted-foreground mb-1">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {pickup.address}
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-muted-foreground">{pickup.bagCount} bags</span>
                        <span className="font-medium text-green-600">${pickup.amount}</span>
                        <StatusBadge status={pickup.serviceType === 'subscription' ? 'completed' : 'assigned'}>
                          {pickup.serviceType === 'subscription' ? 'Subscription' : 
                           pickup.serviceType === 'same-day' ? 'Same-Day' : 'Next-Day'}
                        </StatusBadge>
                      </div>
                      {pickup.instructions && (
                        <div className="text-xs text-blue-600 mt-1">
                          Note: {pickup.instructions}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        ETA: {pickup.estimatedArrival || '~30min'}
                      </div>
                    </div>
                  </div>
                );
              })
            }
          </div>
          
          {/* Route Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-blue-600">
                  {pickups.filter(p => p.status === 'assigned').length}
                </div>
                <div className="text-xs text-muted-foreground">Total Stops</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-600">
                  ${pickups.filter(p => p.status === 'assigned').reduce((sum, p) => sum + (p.amount || 0), 0)}
                </div>
                <div className="text-xs text-muted-foreground">Route Revenue</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-orange-600">
                  ~{Math.round(pickups.filter(p => p.status === 'assigned').length * 0.5)}h
                </div>
                <div className="text-xs text-muted-foreground">Est. Duration</div>
              </div>
            </div>
          </div>
        </MobileCard>
      )}

      {/* Demo Data Section */}
      <MobileCard className="bg-purple-50 dark:bg-purple-900/20">
        <div className="text-center">
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold mb-2">Demo & Testing</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create sample Philadelphia Metro Area customers and pickup requests
          </p>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleCreateDemoData}
            disabled={createDemoMutation.isPending}
          >
            {createDemoMutation.isPending ? 'Creating...' : 'Create Demo Data'}
          </Button>
        </div>
      </MobileCard>
    </MobileSection>
  );

  const renderDriversSection = () => (
    <MobileSection>
      <h2 className="text-xl font-semibold mb-4">Driver Management</h2>
      <div className="space-y-3">
        {drivers.map((driver) => (
          <MobileCard key={driver.id}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium">{driver.username.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <div className="font-medium">{driver.username}</div>
                  <div className="text-sm text-muted-foreground">{driver.email}</div>
                </div>
              </div>
              <StatusBadge status="assigned">Active</StatusBadge>
            </div>
          </MobileCard>
        ))}
        {drivers.length === 0 && (
          <MobileCard className="text-center py-8">
            <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Drivers</h3>
            <p className="text-sm text-muted-foreground">Assign users driver role to see them here</p>
          </MobileCard>
        )}
      </div>
    </MobileSection>
  );

  const renderReportsSection = () => (
    <MobileSection>
      <h2 className="text-xl font-semibold mb-4">Reports & Analytics</h2>
      <MobileCard className="text-center py-8">
        <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-semibold mb-2">Reports Coming Soon</h3>
        <p className="text-sm text-muted-foreground">Business analytics and reports will be available here</p>
      </MobileCard>
    </MobileSection>
  );

  const renderSettingsSection = () => (
    <MobileSection>
      <h2 className="text-xl font-semibold mb-4">Admin Settings</h2>
      <MobileCard className="text-center py-8">
        <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-semibold mb-2">Settings Coming Soon</h3>
        <p className="text-sm text-muted-foreground">Admin configuration options will be available here</p>
      </MobileCard>
    </MobileSection>
  );

  const renderDashboardContent = () => (
    <>
      {/* Metrics Overview */}
      <MobileSection className="pt-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <MobileCard className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{customers.length}</div>
                <div className="text-sm text-blue-600/80 dark:text-blue-400/80">Customers</div>
              </div>
              <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </MobileCard>

          <MobileCard className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">${totalRevenue}</div>
                <div className="text-sm text-green-600/80 dark:text-green-400/80">Revenue</div>
              </div>
              <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </MobileCard>

          <MobileCard className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{pendingPickups.length}</div>
                <div className="text-sm text-orange-600/80 dark:text-orange-400/80">Pending</div>
              </div>
              <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
          </MobileCard>

          <MobileCard className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{activeSubscriptions.length}</div>
                <div className="text-sm text-purple-600/80 dark:text-purple-400/80">Subscriptions</div>
              </div>
              <Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </MobileCard>
        </div>

        {/* Today's Route Overview */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Today's Route Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <MobileCard className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-green-600 dark:text-green-400 mb-1">Subscription Route</div>
                  <div className="text-lg font-semibold">{pickups.filter(p => p.serviceType === 'subscription' && p.status === 'assigned').length} stops</div>
                  <div className="text-xs text-muted-foreground">Est. $60-96 revenue</div>
                </div>
                <Calendar className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </MobileCard>
            
            <MobileCard className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-orange-600 dark:text-orange-400 mb-1">Package Route</div>
                  <div className="text-lg font-semibold">{pickups.filter(p => ['same-day', 'next-day'].includes(p.serviceType || '') && p.status === 'assigned').length} stops</div>
                  <div className="text-xs text-muted-foreground">Est. $120-280 revenue</div>
                </div>
                <Package className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
            </MobileCard>
          </div>

          {/* Today's Route Details */}
          {pickups.filter(p => p.status === 'assigned').length > 0 && (
            <MobileCard className="bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Today's Route Details</h4>
                <Button variant="ghost" size="sm" className="text-blue-600">
                  <MapPin className="w-4 h-4 mr-1" />
                  View on Map
                </Button>
              </div>
              
              <div className="space-y-3">
                {pickups
                  .filter(p => p.status === 'assigned')
                  .sort((a, b) => (a.routeOrder || 0) - (b.routeOrder || 0))
                  .map((pickup, index) => {
                    const customer = users.find(u => u.id === pickup.customerId);
                    const driver = users.find(u => u.id === pickup.driverId);
                    
                    return (
                      <div key={pickup.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{customer?.username || 'Unknown Customer'}</span>
                            <StatusBadge status={pickup.serviceType === 'subscription' ? 'completed' : 'assigned'}>
                              {pickup.serviceType === 'subscription' ? 'Subscription' : 
                               pickup.serviceType === 'same-day' ? 'Same-Day' : 'Next-Day'}
                            </StatusBadge>
                          </div>
                          <div className="text-sm text-muted-foreground mb-1">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {pickup.address}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{pickup.bagCount} bags</span>
                            <span className="font-medium text-green-600">${pickup.amount}</span>
                            {pickup.estimatedArrival && (
                              <span>ETA: {pickup.estimatedArrival}</span>
                            )}
                          </div>
                          {pickup.instructions && (
                            <div className="text-xs text-blue-600 mt-1">
                              Note: {pickup.instructions}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">
                            Driver: {driver?.username || 'Unassigned'}
                          </div>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
              
              {/* Route Summary */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-blue-600">
                      {pickups.filter(p => p.status === 'assigned').length}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Stops</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-green-600">
                      ${pickups.filter(p => p.status === 'assigned').reduce((sum, p) => sum + (p.amount || 0), 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Route Revenue</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-orange-600">
                      ~2.5h
                    </div>
                    <div className="text-xs text-muted-foreground">Est. Duration</div>
                  </div>
                </div>
              </div>
            </MobileCard>
          )}
        </div>
      </MobileSection>

      {renderSubscribersSection()}
      {renderRequestsSection()}
      {renderRoutesSection()}
    </>
  );

  return (
    <MobileLayout 
      title={currentSection === 'dashboard' ? 'Admin Dashboard' : 
             currentSection === 'subscribers' ? 'Subscribers' :
             currentSection === 'requests' ? 'One-Time Requests' :
             currentSection === 'routes' ? 'Route Optimization' :
             currentSection === 'drivers' ? 'Driver Management' :
             currentSection === 'reports' ? 'Reports' :
             currentSection === 'settings' ? 'Settings' : 'Admin Dashboard'}
      rightAction={
        <Button variant="ghost" size="sm" className="p-2">
          <Settings className="w-5 h-5" />
        </Button>
      }
    >
      {renderSectionContent()}
    </MobileLayout>
  );
}