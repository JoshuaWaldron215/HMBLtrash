import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  RefreshCw
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

  // Filter pickups
  const filteredPickups = pickups.filter(pickup => {
    const matchesSearch = pickup.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pickup.id.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || pickup.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAssignPickup = (pickupId: number, driverId: number) => {
    assignPickupMutation.mutate({ pickupId, driverId });
  };

  return (
    <MobileLayout 
      title="Admin Dashboard"
      rightAction={
        <Button variant="ghost" size="sm" className="p-2">
          <Settings className="w-5 h-5" />
        </Button>
      }
    >
      {/* Metrics Overview */}
      <MobileSection className="pt-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <MobileCard className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  ${totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </MobileCard>

          <MobileCard className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 mb-1">Active Subscriptions</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {activeSubscriptions.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </MobileCard>

          <MobileCard className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">Total Customers</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {customers.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </MobileCard>

          <MobileCard className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400 mb-1">Active Drivers</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {drivers.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </MobileCard>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <MobileCard className="text-center">
            <div className="text-xl font-bold text-primary mb-1">
              {pendingPickups.length}
            </div>
            <div className="text-xs text-muted-foreground">
              Pending Pickups
            </div>
          </MobileCard>
          <MobileCard className="text-center">
            <div className="text-xl font-bold text-green-600 mb-1">
              {completedPickups.length}
            </div>
            <div className="text-xs text-muted-foreground">
              Completed
            </div>
          </MobileCard>
          <MobileCard className="text-center">
            <div className="text-xl font-bold text-blue-600 mb-1">
              {Math.round((completedPickups.length / Math.max(pickups.length, 1)) * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">
              Success Rate
            </div>
          </MobileCard>
        </div>
      </MobileSection>

      {/* Route Optimization Section */}
      <MobileSection className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Route Optimization</h2>
          <div className="text-sm text-muted-foreground">
            Philadelphia Metro Area
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Subscription Route */}
          <MobileCard className="bg-white dark:bg-gray-800">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold mb-2">Subscription Route</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Weekly customers • Predictable income • $5-8/stop
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Pending Subscriptions:</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Est. Revenue:</span>
                  <span className="font-medium text-green-600">$60-96</span>
                </div>
              </div>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => handleOptimizeRoute('subscription')}
                disabled={optimizeRouteMutation.isPending}
              >
                {optimizeRouteMutation.isPending ? 'Optimizing...' : 'Optimize Subscription Route'}
              </Button>
            </div>
          </MobileCard>

          {/* Package Route */}
          <MobileCard className="bg-white dark:bg-gray-800">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-semibold mb-2">Package Route</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Same-day + Next-day • Premium pricing • $15-35/stop
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Pending Packages:</span>
                  <span className="font-medium">8</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Est. Revenue:</span>
                  <span className="font-medium text-orange-600">$120-280</span>
                </div>
              </div>
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700"
                onClick={() => handleOptimizeRoute('package')}
                disabled={optimizeRouteMutation.isPending}
              >
                {optimizeRouteMutation.isPending ? 'Optimizing...' : 'Optimize Package Route'}
              </Button>
            </div>
          </MobileCard>
        </div>

        {/* Route Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <h4 className="font-semibold mb-3">Today's Route Options</h4>
          <div className="text-sm text-muted-foreground">
            Choose which route to run based on your schedule and income goals:
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>• Subscription Route: Reliable, relationship-building</span>
              <span className="text-green-600 font-medium">6-8 stops</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>• Package Route: Higher profit, time-sensitive</span>
              <span className="text-orange-600 font-medium">4-6 stops</span>
            </div>
          </div>
        </div>

        {/* Demo Data Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mt-4">
          <h4 className="font-semibold mb-3">Demo & Testing</h4>
          <div className="text-sm text-muted-foreground mb-3">
            Create sample Philadelphia Metro Area customers and pickup requests for testing
          </div>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => handleCreateDemoData()}
            disabled={createDemoMutation.isPending}
          >
            {createDemoMutation.isPending ? 'Creating...' : 'Create Demo Data'}
          </Button>
        </div>
      </MobileSection>

      {/* Pickups Management */}
      <MobileSection className="bg-muted/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Manage Pickups</h2>
          <Button variant="ghost" size="sm" className="text-primary">
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Search pickups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="app-input"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Pickups List */}
        <div className="space-y-3">
          {filteredPickups.slice(0, 10).map((pickup) => (
            <MobileCard key={pickup.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">#{pickup.id}</span>
                    <StatusBadge status={pickup.status as any}>
                      {pickup.status}
                    </StatusBadge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <MapPin className="w-3 h-3 text-muted-foreground mr-1" />
                      <span className="truncate">{pickup.address}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Package className="w-3 h-3 mr-1" />
                      <span>{pickup.bagCount} bags</span>
                      <span className="mx-2">•</span>
                      <span>{pickup.serviceType}</span>
                      <span className="mx-2">•</span>
                      <span>${pickup.amount}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>
                        {pickup.scheduledDate ? 
                          new Date(pickup.scheduledDate).toLocaleDateString() : 
                          'Date pending'
                        }
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {pickup.status === 'pending' && (
                    <Select
                      onValueChange={(value) => handleAssignPickup(pickup.id, parseInt(value))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Assign Driver" />
                      </SelectTrigger>
                      <SelectContent>
                        {drivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id.toString()}>
                            {driver.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button variant="ghost" size="sm" className="p-1">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </MobileCard>
          ))}
        </div>

        {filteredPickups.length === 0 && (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Pickups Found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </MobileSection>

      {/* Users Management */}
      <MobileSection>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Users</h2>
          <Button variant="ghost" size="sm" className="text-primary">
            <UserPlus className="w-4 h-4 mr-1" />
            Add User
          </Button>
        </div>

        <div className="space-y-3">
          {/* Customers Summary */}
          <MobileCard>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Customers</h3>
                <p className="text-sm text-muted-foreground">
                  {customers.length} registered customers
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </div>
            </div>
          </MobileCard>

          {/* Drivers Summary */}
          <MobileCard>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Drivers</h3>
                <p className="text-sm text-muted-foreground">
                  {drivers.length} active drivers
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <Truck className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </div>
            </div>
          </MobileCard>
        </div>
      </MobileSection>

      {/* Recent Activity */}
      <MobileSection className="bg-muted/20">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {pickups.slice(0, 5).map((pickup) => (
            <div key={pickup.id} className="flex items-center space-x-3 p-3 bg-background rounded-lg">
              <div className={`w-2 h-2 rounded-full ${
                pickup.status === 'completed' ? 'bg-green-500' : 
                pickup.status === 'assigned' ? 'bg-blue-500' : 
                'bg-yellow-500'
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Pickup #{pickup.id} {pickup.status === 'completed' ? 'completed' : 'updated'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {pickup.address} • {pickup.bagCount} bags
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                {pickup.scheduledDate ? 
                  new Date(pickup.scheduledDate).toLocaleDateString() : 
                  'Today'
                }
              </div>
            </div>
          ))}
        </div>
      </MobileSection>

      {/* Quick Actions */}
      <MobileSection>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <MobileButton 
            variant="outline"
            className="flex flex-col items-center space-y-2 h-auto py-4"
          >
            <Download className="w-6 h-6" />
            <span>Export Data</span>
          </MobileButton>
          
          <MobileButton 
            variant="outline"
            className="flex flex-col items-center space-y-2 h-auto py-4"
          >
            <UserPlus className="w-6 h-6" />
            <span>Add Driver</span>
          </MobileButton>
          
          <MobileButton 
            variant="outline"
            className="flex flex-col items-center space-y-2 h-auto py-4"
          >
            <Calendar className="w-6 h-6" />
            <span>Schedule Route</span>
          </MobileButton>
          
          <MobileButton 
            variant="outline"
            className="flex flex-col items-center space-y-2 h-auto py-4"
          >
            <Settings className="w-6 h-6" />
            <span>Settings</span>
          </MobileButton>
        </div>
      </MobileSection>
    </MobileLayout>
  );
}