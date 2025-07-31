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
  Navigation,
  Edit3,
  AlertTriangle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Eye,
  Trash2,
  Phone,
  Mail,
  X,
  Save
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { authenticatedRequest } from '@/lib/auth';
import ReschedulePickupModal from '@/components/reschedule-pickup-modal';
import type { Pickup, User, Subscription } from '@shared/schema';

export default function Admin() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showClusters, setShowClusters] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<any>(null);
  const [reschedulePickup, setReschedulePickup] = useState<{ pickup: Pickup; customer: User } | null>(null);
  
  // Enhanced subscriber management state
  const [selectedSubscriber, setSelectedSubscriber] = useState<{subscriber: any; customer: User; pickups: Pickup[]} | null>(null);
  const [editingSubscriber, setEditingSubscriber] = useState<any>(null);
  const [subscriberFilter, setSubscriberFilter] = useState<string>('all');
  const [subscriberSearch, setSubscriberSearch] = useState('');
  const [packageFilter, setPackageFilter] = useState<string>('all');
  
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
    queryFn: () => authenticatedRequest('GET', '/api/admin/pickups').then(res => res.json() as Promise<Pickup[]>),
  });

  const { data: usersData = { customers: [], drivers: [], admins: [] } } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: () => authenticatedRequest('GET', '/api/admin/users').then(res => res.json()),
  });

  // Fetch address clusters for geographic view
  const { data: clusterData } = useQuery({
    queryKey: ['/api/admin/address-clusters'],
    queryFn: () => authenticatedRequest('GET', '/api/admin/address-clusters').then(res => res.json()),
    enabled: showClusters,
  });

  // Fetch admin routes data
  const { data: routesData } = useQuery({
    queryKey: ['/api/admin/routes'],
    queryFn: () => authenticatedRequest('GET', '/api/admin/routes').then(res => res.json()),
    enabled: currentSection === 'routes',
  });

  // Fetch subscription data for enhanced subscriber management  
  const { data: adminSubscriptions = [] } = useQuery({
    queryKey: ['/api/admin/subscriptions'],
    queryFn: () => authenticatedRequest('GET', '/api/admin/subscriptions').then(res => res.json() as Promise<Subscription[]>),
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
      authenticatedRequest('PATCH', `/api/admin/users/${userId}/role`, { role }),
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
      
      const response = await authenticatedRequest('POST', endpoint);
      
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

  // Pickup completion handlers
  const handleCompletePickup = async (pickupId: number) => {
    try {
      await authenticatedRequest('PATCH', `/api/admin/complete-pickup/${pickupId}`, { status: 'completed' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pickups'] });
      toast({
        title: "Pickup Completed",
        description: "Pickup has been marked as completed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete pickup. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMarkIssue = async (pickupId: number) => {
    try {
      await authenticatedRequest('PATCH', `/api/admin/pickup-issue/${pickupId}`, { status: 'issue' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pickups'] });
      toast({
        title: "Issue Reported",
        description: "Pickup has been marked with an issue.",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to report issue. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMarkIncomplete = async (pickupId: number) => {
    try {
      await authenticatedRequest('PATCH', `/api/admin/pickup-incomplete/${pickupId}`, { status: 'incomplete' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pickups'] });
      toast({
        title: "Pickup Incomplete",
        description: "Pickup has been marked as incomplete.",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark incomplete. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Cluster route creation mutation
  const createClusterRouteMutation = useMutation({
    mutationFn: async ({ clusterId, driverId }: { clusterId: string; driverId?: number }) => {
      const response = await authenticatedRequest('POST', '/api/admin/optimize-cluster-route', {
        clusterId,
        driverId
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pickups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/address-clusters'] });
      toast({
        title: "Route Created!",
        description: `Created ${data.totalStops} pickup stops for ${data.cluster.name}`,
      });
      setSelectedCluster(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Route",
        description: error.message || "Could not create cluster route",
        variant: "destructive",
      });
    },
  });

  // Demo data creation mutation
  const createDemoMutation = useMutation({
    mutationFn: async () => {
      const response = await authenticatedRequest('POST', '/api/admin/create-demo-data');
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



  // Assign pickup mutation
  const assignPickupMutation = useMutation({
    mutationFn: ({ pickupId, driverId }: { pickupId: number; driverId: number }) => 
      authenticatedRequest('POST', `/api/admin/pickups/${pickupId}/assign`, { driverId }),
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
  const totalRevenue = pickups.reduce((sum, p) => sum + (parseFloat(p.amount?.toString() || '0') || 0), 0);
  const pendingPickups = pickups.filter(p => p.status === 'pending');
  const completedPickups = pickups.filter(p => p.status === 'completed');
  const activeSubscriptions = adminSubscriptions.filter(s => s.status === 'active');

  // Filter pickups for one-time requests
  const oneTimePickups = pickups.filter(p => p.serviceType !== 'subscription');
  const filteredPickups = oneTimePickups.filter(pickup => {
    const matchesServiceType = statusFilter === 'all' || pickup.serviceType === statusFilter;
    return matchesServiceType;
  });

  const handleAssignPickup = (pickupId: number, driverId: number) => {
    assignPickupMutation.mutate({ pickupId, driverId });
  };

  // Enhanced subscriber management mutations
  const updateSubscriberMutation = useMutation({
    mutationFn: async ({ subscriptionId, updates }: { subscriptionId: number; updates: any }) => {
      const response = await authenticatedRequest('PATCH', `/api/admin/subscriptions/${subscriptionId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Subscriber Updated",
        description: "Subscriber information has been updated successfully.",
      });
      setEditingSubscriber(null);
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update subscriber. Please try again.",
        variant: "destructive",
      });
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: number) => {
      const response = await authenticatedRequest('DELETE', `/api/admin/subscriptions/${subscriptionId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pickups'] });
      toast({
        title: "Subscription Cancelled",
        description: "Subscription has been cancelled successfully.",
      });
      setSelectedSubscriber(null);
    },
    onError: () => {
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const cancelPickupMutation = useMutation({
    mutationFn: async (pickupId: number) => {
      const response = await authenticatedRequest('DELETE', `/api/admin/pickups/${pickupId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pickups'] });
      toast({
        title: "Pickup Cancelled",
        description: "One-time pickup has been cancelled successfully.",
      });
      setSelectedSubscriber(null);
    },
    onError: () => {
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel pickup. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Helper function to get pickup day of week
  const getPickupDayOfWeek = (subscription: any) => {
    const relatedPickups = pickups.filter(p => 
      p.customerId === subscription.customerId && 
      p.serviceType === 'subscription' && 
      p.scheduledDate
    );
    
    if (relatedPickups.length > 0) {
      const scheduledDate = new Date(relatedPickups[0].scheduledDate!);
      return scheduledDate.toLocaleDateString('en-US', { weekday: 'long' });
    }
    
    return 'Not scheduled';
  };

  // Section rendering functions
  const renderSubscribersSection = () => {
    // Filter and search subscribers
    const filteredSubscriptions = activeSubscriptions.filter(subscription => {
      const customer = users.find(u => u.id === subscription.customerId);
      
      // Search filter
      const matchesSearch = subscriberSearch === '' || 
        customer?.username?.toLowerCase().includes(subscriberSearch.toLowerCase()) ||
        customer?.email?.toLowerCase().includes(subscriberSearch.toLowerCase()) ||
        customer?.address?.toLowerCase().includes(subscriberSearch.toLowerCase());
      
      // Package filter - use pricePerMonth to determine package type
      const price = parseFloat(subscription.pricePerMonth?.toString() || '35');
      const packageType = price <= 35 ? 'basic' :
                         price <= 60 ? 'clean-carry' :
                         price <= 75 ? 'heavy-duty' : 'premium';
      const matchesPackage = packageFilter === 'all' || packageType === packageFilter;
      
      // Status filter
      const matchesStatus = subscriberFilter === 'all' || subscription.status === subscriberFilter;
      
      return matchesSearch && matchesPackage && matchesStatus;
    });

    return (
      <MobileSection className="bg-muted/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Active Subscribers</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/subscriptions'] })}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>

        {/* Search and Filter Controls */}
        <div className="space-y-3 mb-6">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search customers..."
                value={subscriberSearch}
                onChange={(e) => setSubscriberSearch(e.target.value)}
                className="h-8"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={subscriberFilter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSubscriberFilter('all')}
              className="h-8"
            >
              All ({activeSubscriptions.length})
            </Button>
            <Button 
              variant={subscriberFilter === 'active' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSubscriberFilter('active')}
              className="h-8"
            >
              Active ({activeSubscriptions.filter(s => s.status === 'active').length})
            </Button>
            <Button 
              variant={subscriberFilter === 'paused' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSubscriberFilter('paused')}
              className="h-8"
            >
              Paused ({activeSubscriptions.filter(s => s.status === 'paused').length})
            </Button>
          </div>

          {/* Package type filters */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={packageFilter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setPackageFilter('all')}
              className="h-8"
            >
              All Packages
            </Button>
            <Button 
              variant={packageFilter === 'basic' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setPackageFilter('basic')}
              className="h-8 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
            >
              Basic ($35)
            </Button>
            <Button 
              variant={packageFilter === 'clean-carry' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setPackageFilter('clean-carry')}
              className="h-8 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              Clean & Carry ($60)
            </Button>
            <Button 
              variant={packageFilter === 'heavy-duty' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setPackageFilter('heavy-duty')}
              className="h-8 bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
            >
              Heavy Duty ($75)
            </Button>
            <Button 
              variant={packageFilter === 'premium' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setPackageFilter('premium')}
              className="h-8 bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
            >
              Premium ($150)
            </Button>
          </div>
        </div>

        {filteredSubscriptions.length > 0 ? (
          <div className="space-y-3">
            {filteredSubscriptions.map((subscription) => {
              const customer = users.find(u => u.id === subscription.customerId);
              const pickupDay = getPickupDayOfWeek(subscription);
              const relatedPickups = pickups.filter(p => p.customerId === subscription.customerId);
              const price = parseFloat(subscription.pricePerMonth?.toString() || '35');
              const packageType = price <= 35 ? 'basic' :
                                 price <= 60 ? 'clean-carry' :
                                 price <= 75 ? 'heavy-duty' : 'premium';
              
              return (
                <MobileCard key={subscription.id} className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{customer?.username || 'Unknown'}</span>
                        <StatusBadge status={subscription.status === 'active' ? 'completed' : 'pending'}>
                          {subscription.status}
                        </StatusBadge>
                        <span className={`text-xs px-2 py-1 rounded ${
                          packageType === 'basic' ? 'bg-blue-100 text-blue-700' :
                          packageType === 'clean-carry' ? 'bg-green-100 text-green-700' :
                          packageType === 'heavy-duty' ? 'bg-orange-100 text-orange-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {packageType === 'clean-carry' ? 'Clean & Carry' : 
                           packageType === 'heavy-duty' ? 'Heavy Duty' :
                           packageType === 'premium' ? 'Premium' : 'Basic'}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <MapPin className="w-3 h-3 text-muted-foreground mr-1" />
                          <span className="truncate">{customer?.address || 'No address'}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>Pickup Day: {pickupDay}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Package className="w-3 h-3 mr-1" />
                          <span>{subscription.bagCountLimit || 6} bags • {subscription.frequency || 'weekly'}</span>
                        </div>
                        {customer?.phone && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Phone className="w-3 h-3 mr-1" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        ${subscription.pricePerMonth || 35}/month
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {relatedPickups.length} total pickups
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSubscriber({
                              subscriber: subscription,
                              customer: customer!,
                              pickups: relatedPickups
                            });
                          }}
                          className="text-xs h-6 px-2"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                </MobileCard>
              );
            })}
          </div>
        ) : (
          <MobileCard className="text-center py-8">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Subscribers Found</h3>
            <p className="text-sm text-muted-foreground">
              {subscriberSearch || packageFilter !== 'all' || subscriberFilter !== 'all' 
                ? 'Try adjusting your search filters' 
                : 'Subscribers will appear here when they sign up for subscription service'
              }
            </p>
          </MobileCard>
        )}

        {/* Subscriber Detail Modal */}
        {selectedSubscriber && (
          <Dialog open={!!selectedSubscriber} onOpenChange={() => setSelectedSubscriber(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {selectedSubscriber.customer.username} - Subscriber Details
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Customer Information */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Customer Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <p className="font-medium">{selectedSubscriber.customer.username}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {selectedSubscriber.customer.email}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <p className="font-medium flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {selectedSubscriber.customer.phone || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Address:</span>
                      <p className="font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {selectedSubscriber.customer.address}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subscription Details */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Subscription Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Package:</span>
                      <p className="font-medium">
                        {(() => {
                          const price = parseFloat(selectedSubscriber.subscriber.pricePerMonth?.toString() || '35');
                          const packageType = price <= 35 ? 'basic' :
                                             price <= 60 ? 'clean-carry' :
                                             price <= 75 ? 'heavy-duty' : 'premium';
                          return packageType === 'clean-carry' ? 'Clean & Carry' : 
                                 packageType === 'heavy-duty' ? 'Heavy Duty' :
                                 packageType === 'premium' ? 'Premium Property' : 'Basic';
                        })()}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <p className="font-medium text-green-600">${selectedSubscriber.subscriber.pricePerMonth}/month</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <StatusBadge status={selectedSubscriber.subscriber.status === 'active' ? 'completed' : 'pending'}>
                        {selectedSubscriber.subscriber.status}
                      </StatusBadge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pickup Day:</span>
                      <p className="font-medium">{getPickupDayOfWeek(selectedSubscriber.subscriber)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Bag Limit:</span>
                      <p className="font-medium">{selectedSubscriber.subscriber.bagCountLimit || 6} bags</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Frequency:</span>
                      <p className="font-medium">{selectedSubscriber.subscriber.frequency || 'Weekly'}</p>
                    </div>
                  </div>
                </div>

                {/* Recent Pickups */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Recent Pickups ({selectedSubscriber.pickups.length})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedSubscriber.pickups.slice(0, 5).map((pickup) => (
                      <div key={pickup.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                        <div>
                          <span className="font-medium">#{pickup.id}</span>
                          <span className="mx-2">•</span>
                          <span>{pickup.bagCount} bags</span>
                          <span className="mx-2">•</span>
                          <StatusBadge status={pickup.status as any}>
                            {pickup.status}
                          </StatusBadge>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${parseFloat(pickup.amount?.toString() || '0').toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">
                            {pickup.scheduledDate ? new Date(pickup.scheduledDate).toLocaleDateString() : 'No date'}
                          </div>
                        </div>
                      </div>
                    ))}
                    {selectedSubscriber.pickups.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">No pickups yet</p>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingSubscriber(selectedSubscriber.subscriber)}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Details
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel this subscription? This action cannot be undone.')) {
                      cancelSubscriptionMutation.mutate(selectedSubscriber.subscriber.id);
                    }
                  }}
                  disabled={cancelSubscriptionMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {cancelSubscriptionMutation.isPending ? 'Cancelling...' : 'Cancel Subscription'}
                </Button>
                <Button onClick={() => setSelectedSubscriber(null)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Subscriber Modal */}
        {editingSubscriber && (
          <Dialog open={!!editingSubscriber} onOpenChange={() => setEditingSubscriber(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Subscription</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="pricePerMonth">Package Type</Label>
                  <Select 
                    value={editingSubscriber.pricePerMonth?.toString()}
                    onValueChange={(value) => setEditingSubscriber({...editingSubscriber, pricePerMonth: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="35">Basic - $35/month</SelectItem>
                      <SelectItem value="60">Clean & Carry - $60/month</SelectItem>
                      <SelectItem value="75">Heavy Duty - $75/month</SelectItem>
                      <SelectItem value="150">Premium Property - $150/month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={editingSubscriber.status}
                    onValueChange={(value) => setEditingSubscriber({...editingSubscriber, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="bagCountLimit">Bag Count Limit</Label>
                  <Input
                    id="bagCountLimit"
                    type="number"
                    min="1"
                    max="20"
                    value={editingSubscriber.bagCountLimit || 6}
                    onChange={(e) => setEditingSubscriber({...editingSubscriber, bagCountLimit: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingSubscriber(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    updateSubscriberMutation.mutate({
                      subscriptionId: editingSubscriber.id,
                      updates: {
                        status: editingSubscriber.status,
                        bagCountLimit: editingSubscriber.bagCountLimit,
                        pricePerMonth: editingSubscriber.pricePerMonth
                      }
                    });
                  }}
                  disabled={updateSubscriberMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateSubscriberMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </MobileSection>
    );
  };;

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

      {/* Status Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button 
          variant={statusFilter === 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setStatusFilter('all')}
          className="h-8"
        >
          All ({pickups.filter(p => p.serviceType !== 'subscription').length})
        </Button>
        <Button 
          variant={statusFilter === 'pending' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setStatusFilter('pending')}
          className="h-8"
        >
          Pending ({pickups.filter(p => p.serviceType !== 'subscription' && p.status === 'pending').length})
        </Button>
        <Button 
          variant={statusFilter === 'assigned' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setStatusFilter('assigned')}
          className="h-8"
        >
          Assigned ({pickups.filter(p => p.serviceType !== 'subscription' && p.status === 'assigned').length})
        </Button>
        <Button 
          variant={statusFilter === 'completed' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setStatusFilter('completed')}
          className="h-8"
        >
          Completed ({pickups.filter(p => p.serviceType !== 'subscription' && p.status === 'completed').length})
        </Button>
        {pickups.filter(p => p.serviceType !== 'subscription' && p.status === 'issue').length > 0 && (
          <Button
            variant={statusFilter === 'issue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('issue')}
            className="h-8 text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            Issues ({pickups.filter(p => p.serviceType !== 'subscription' && p.status === 'issue').length})
          </Button>
        )}
        {pickups.filter(p => p.serviceType !== 'subscription' && p.status === 'incomplete').length > 0 && (
          <Button
            variant={statusFilter === 'incomplete' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('incomplete')}
            className="h-8 text-red-600 border-red-200 hover:bg-red-50"
          >
            Incomplete ({pickups.filter(p => p.serviceType !== 'subscription' && p.status === 'incomplete').length})
          </Button>
        )}
      </div>

      {/* Date Sort Controls */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-muted-foreground">Sort by date:</span>
        <Button
          variant={sortOrder === 'desc' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortOrder('desc')}
          className="h-8"
        >
          <ArrowDown className="w-3 h-3 mr-1" />
          Newest First
        </Button>
        <Button
          variant={sortOrder === 'asc' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortOrder('asc')}
          className="h-8"
        >
          <ArrowUp className="w-3 h-3 mr-1" />
          Oldest First
        </Button>
      </div>

      <div className="space-y-3">
        {(() => {
          // Filter requests based on search and status
          const filteredPickups = pickups.filter(pickup => {
            // Only show non-subscription pickups
            if (pickup.serviceType === 'subscription') return false;
            
            const matchesSearch = searchTerm === '' || 
              pickup.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              users.find(u => u.id === pickup.customerId)?.username?.toLowerCase().includes(searchTerm.toLowerCase());
              
            const matchesFilter = statusFilter === 'all' || pickup.status === statusFilter;
              
            return matchesSearch && matchesFilter;
          })
          // Sort by scheduled date
          .sort((a, b) => {
            const dateA = new Date(a.scheduledDate || a.createdAt || new Date()).getTime();
            const dateB = new Date(b.scheduledDate || b.createdAt || new Date()).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
          });
          
          return filteredPickups.length > 0 ? (
            filteredPickups.slice(0, 10).map((pickup) => {
              const customer = users.find(u => u.id === pickup.customerId);
              const isUrgent = pickup.serviceType === 'same-day';
            
            return (
              <MobileCard key={pickup.id} className={isUrgent ? 'border-orange-200 bg-orange-50 dark:bg-orange-900/10' : ''}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">#{pickup.id}</span>
                      <StatusBadge status={pickup.status === 'completed' ? 'completed' : 
                                         pickup.status === 'issue' ? 'assigned' : 
                                         pickup.status === 'incomplete' ? 'assigned' :
                                         pickup.status as 'pending' | 'completed' | 'assigned'}>
                        {pickup.status === 'issue' ? 'Issue' : 
                         pickup.status === 'incomplete' ? 'Incomplete' :
                         pickup.status}
                      </StatusBadge>
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
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>
                          Scheduled: {pickup.scheduledDate 
                            ? new Date(pickup.scheduledDate).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'No date set'
                          }
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>
                          Created: {pickup.createdAt ? 
                            new Date(pickup.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Unknown'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${isUrgent ? 'text-orange-600' : 'text-blue-600'}`}>
                      ${parseFloat(pickup.amount?.toString() || '0').toFixed(2)}
                    </span>
                    <div className="text-xs text-muted-foreground">
                      {pickup.serviceType === 'same-day' ? '$25-65' : '$15-50'}
                    </div>
                    <div className="flex flex-col gap-1 mt-2">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReschedulePickup({ pickup, customer: customer! })}
                          className="text-xs h-6 px-2"
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          Reschedule
                        </Button>
                        {pickup.status === 'assigned' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCompletePickup(pickup.id)}
                            className="text-xs h-6 px-2 text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Complete
                          </Button>
                        )}
                      </div>
                      {pickup.status === 'assigned' && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkIssue(pickup.id)}
                            className="text-xs h-6 px-2 text-orange-600 hover:text-orange-700"
                          >
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Issue
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkIncomplete(pickup.id)}
                            className="text-xs h-6 px-2 text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Incomplete
                          </Button>
                        </div>
                      )}
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
          );
        })()}
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
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-blue-600"
                onClick={() => {
                  const routes = routesData?.routes || [];
                  const routeDetails = routes.map((r: any, i: number) => 
                    `Route ${i + 1}: ${r.driverName} - ${new Date(r.date).toLocaleDateString()}\n` +
                    `Status: ${r.status} (${r.progress}% complete)\n` +
                    `Stops: ${r.totalStops} | Revenue: $${r.estimatedRevenue}\n` +
                    r.pickups.map((p: any, idx: number) => 
                      `  ${idx + 1}. ${p.address} (${p.bagCount} bags)${p.status === 'completed' ? ' ✓' : ''}`
                    ).join('\n')
                  ).join('\n\n');
                  
                  alert(routeDetails || 'No routes created yet. Create routes from address clusters in the dashboard.');
                }}
              >
                <Navigation className="w-4 h-4 mr-1" />
                View All Routes
              </Button>
              <Button variant="ghost" size="sm" className="text-blue-600">
                <Navigation className="w-4 h-4 mr-1" />
                Open in Maps
              </Button>
            </div>
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
                        <span className="font-medium text-green-600">${parseFloat(pickup.amount?.toString() || '0').toFixed(2)}</span>
                        <StatusBadge status={pickup.serviceType === 'subscription' ? 'completed' : 'assigned'}>
                          {pickup.serviceType === 'subscription' ? 'Subscription' : 
                           pickup.serviceType === 'same-day' ? 'Same-Day' : 'Next-Day'}
                        </StatusBadge>
                      </div>
                      {pickup.specialInstructions && (
                        <div className="text-xs text-blue-600 mt-1">
                          Note: {pickup.specialInstructions}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        ETA: {pickup.scheduledDate ? new Date(pickup.scheduledDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '~30min'}
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
                  ${pickups.filter(p => p.status === 'assigned').reduce((sum, p) => sum + (parseFloat(p.amount?.toString() || '0') || 0), 0).toFixed(2)}
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

  // Simple cluster view component
  const ClusterView = () => {
    const clusters = clusterData?.clusters || [];
    
    if (clusters.length === 0) {
      return (
        <MobileCard className="text-center py-6">
          <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No customer clusters found</p>
        </MobileCard>
      );
    }

    return (
      <div className="space-y-3">
        {clusters.map((cluster: any) => (
          <MobileCard key={cluster.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-lg">{cluster.name}</h4>
                <p className="text-sm text-muted-foreground">{cluster.totalCustomers} pickups • ${cluster.estimatedRevenue} revenue</p>
              </div>
              <StatusBadge status={cluster.status === 'available' ? 'pending' : 'completed'}>
                {cluster.status}
              </StatusBadge>
            </div>
            
            <div className="flex gap-2">
              <MobileButton
                variant="outline"
                size="sm"
                onClick={() => setSelectedCluster(selectedCluster?.id === cluster.id ? null : cluster)}
                className="flex-1"
              >
                📋 {selectedCluster?.id === cluster.id ? 'Hide' : 'View'} Details
              </MobileButton>
              
              {cluster.status === 'available' && (
                <MobileButton
                  variant="primary"
                  size="sm"
                  onClick={() => createClusterRouteMutation.mutate({ clusterId: cluster.id })}
                  disabled={createClusterRouteMutation.isPending}
                  className="flex-1"
                >
                  {createClusterRouteMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    '🚚'
                  )} Create Route
                </MobileButton>
              )}
            </div>

            {/* Customer Details */}
            {selectedCluster?.id === cluster.id && (
              <div className="mt-4 pt-4 border-t border-border">
                <h5 className="font-medium mb-2">Customers ({cluster.addresses.length})</h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {cluster.addresses.map((address: any) => (
                    <div key={address.customerId} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{address.username}</div>
                        <div className="text-xs text-muted-foreground truncate">{address.address}</div>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {address.bagCount} bags
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </MobileCard>
        ))}
      </div>
    );
  };

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
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">${totalRevenue.toFixed(2)}</div>
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

        {/* Address Clusters */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Geographic Areas</h3>
            <MobileButton 
              variant="outline" 
              size="sm"
              onClick={() => setShowClusters(!showClusters)}
            >
              <MapPin className="w-4 h-4 mr-1" />
              {showClusters ? 'Hide' : 'View'} Clusters
            </MobileButton>
          </div>
          
          {showClusters && <ClusterView />}
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
                            <span className="font-medium text-green-600">${parseFloat(pickup.amount?.toString() || '0').toFixed(2)}</span>
                            {pickup.estimatedArrival && (
                              <span>ETA: {typeof pickup.estimatedArrival === 'string' ? pickup.estimatedArrival : pickup.estimatedArrival.toLocaleTimeString()}</span>
                            )}
                          </div>
                          {pickup.specialInstructions && (
                            <div className="text-xs text-blue-600 mt-1">
                              Note: {pickup.specialInstructions}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">
                            Driver: {driver?.username || 'Unassigned'}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReschedulePickup({ pickup, customer: customer! })}
                            className="text-xs h-6 px-2 mt-1"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Reschedule
                          </Button>
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
                      ${pickups.filter(p => p.status === 'assigned').reduce((sum, p) => sum + (parseFloat(p.amount?.toString() || '0') || 0), 0).toFixed(2)}
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
      
      {/* Reschedule Pickup Modal */}
      {reschedulePickup && (
        <ReschedulePickupModal
          pickup={reschedulePickup.pickup}
          customer={reschedulePickup.customer}
          isOpen={!!reschedulePickup}
          onClose={() => setReschedulePickup(null)}
        />
      )}
    </MobileLayout>
  );
}