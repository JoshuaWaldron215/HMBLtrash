import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { 
  Users, 
  Package, 
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
  Edit,
  Play,
  Pause,
  User,
  FileText,
  BarChart3,
  ChevronDown,
  ChevronRight,
  X,
  Check
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { authenticatedRequest } from '@/lib/auth';
import type { Pickup, User, Subscription } from '@shared/schema';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AdminRedesigned() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dayFilter, setDayFilter] = useState<string>('all');
  const [assignedFilter, setAssignedFilter] = useState<string>('all');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    dashboard: true,
    subscribers: false,
    requests: false,
    routes: false
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  
  // Determine current section from route
  const getCurrentSection = () => {
    if (location === '/admin/subscribers') return 'subscribers';
    if (location === '/admin/requests') return 'requests';  
    if (location === '/admin/routes') return 'routes';
    if (location === '/admin/members') return 'members';
    if (location === '/admin/drivers') return 'drivers';
    if (location === '/admin/reports') return 'reports';
    if (location === '/admin/settings') return 'settings';
    return 'dashboard';
  };
  
  const currentSection = getCurrentSection();

  // Data queries
  const { data: users = [] } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const res = await authenticatedRequest('GET', '/api/admin/users');
      return res.json();
    }
  });

  // All members data with stats
  const { data: allMembers = [] } = useQuery({
    queryKey: ['/api/admin/all-members'],
    queryFn: async () => {
      const res = await authenticatedRequest('GET', '/api/admin/all-members');
      return res.json();
    }
  });

  const { data: pickups = [] } = useQuery({
    queryKey: ['/api/admin/pickups'],
    queryFn: async () => {
      const res = await authenticatedRequest('GET', '/api/admin/pickups');
      return res.json();
    }
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['/api/admin/subscriptions'],
    queryFn: async () => {
      const res = await authenticatedRequest('GET', '/api/admin/subscriptions');
      return res.json();
    }
  });

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

  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      authenticatedRequest('PATCH', `/api/admin/subscriptions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscriptions'] });
      toast({
        title: "Subscription Updated",
        description: "The subscription has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate metrics
  const customers = users.filter(u => u.role === 'customer');
  const drivers = users.filter(u => u.role === 'driver');
  const pendingPickups = pickups.filter(p => p.status === 'pending');
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');

  // Filter functions
  const filteredPickups = pickups.filter(pickup => {
    const matchesSearch = pickup.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pickup.status === statusFilter;
    const matchesAssigned = assignedFilter === 'all' || 
      (assignedFilter === 'assigned' && pickup.driverId) ||
      (assignedFilter === 'unassigned' && !pickup.driverId);
    
    return matchesSearch && matchesStatus && matchesAssigned;
  });

  const filteredSubscriptions = subscriptions.filter(sub => {
    const customer = customers.find(c => c.id === sub.customerId);
    const matchesSearch = customer?.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         customer?.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDay = dayFilter === 'all' || sub.pickupDay === dayFilter;
    
    return matchesSearch && matchesDay;
  });

  const handleAssignPickup = (pickupId: number, driverId: number) => {
    assignPickupMutation.mutate({ pickupId, driverId });
  };

  const handleUpdateSubscription = (id: number, data: any) => {
    updateSubscriptionMutation.mutate({ id, data });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Dashboard Overview
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active Subscribers</p>
                <p className="text-2xl font-bold">{activeSubscriptions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Pickups</p>
                <p className="text-2xl font-bold">{pendingPickups.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Truck className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active Drivers</p>
                <p className="text-2xl font-bold">{drivers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Today's Pickups</p>
                <p className="text-2xl font-bold">{pickups.filter(p => {
                  const today = new Date();
                  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                  const pickupDate = new Date(p.scheduledDate);
                  const pickupDateString = `${pickupDate.getFullYear()}-${String(pickupDate.getMonth() + 1).padStart(2, '0')}-${String(pickupDate.getDate()).padStart(2, '0')}`;
                  return p.scheduledDate && pickupDateString === todayString;
                }).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              onClick={() => setLocation('/admin/subscribers')}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Manage Subscribers
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/admin/requests')}
              className="flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              View Requests
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/admin/routes')}
              className="flex items-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              Route Planning
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/admin/reports')}
              className="flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              View Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Subscribers Management
  const renderSubscribers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Subscriber Management</h2>
        <Button className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Add Subscriber
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-64">
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={dayFilter} onValueChange={setDayFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by day" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Days</SelectItem>
            {DAYS.map(day => (
              <SelectItem key={day} value={day}>{day}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subscribers Table */}
      <div className="space-y-4">
        {filteredSubscriptions.map((subscription) => {
          const customer = customers.find(c => c.id === subscription.customerId);
          if (!customer) return null;

          return (
            <Card key={subscription.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{customer.firstName} {customer.lastName}</h3>
                        <p className="text-sm text-muted-foreground">{customer.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {customer.address || 'No address'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {subscription.pickupDay || 'Not assigned'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {subscription.bagCount || 'Default'} bags
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={subscription.status as any}>
                      {subscription.status}
                    </StatusBadge>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  // One-Time Requests
  const renderRequests = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">One-Time Requests</h2>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-orange-600">
            Same-Day ({filteredPickups.filter(p => p.priority === 'same-day').length})
          </Badge>
          <Badge variant="outline" className="text-blue-600">
            Next-Day ({filteredPickups.filter(p => p.priority === 'next-day').length})
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-64">
          <Input
            placeholder="Search by address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={assignedFilter} onValueChange={setAssignedFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Assignment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredPickups.map((pickup) => {
          const customer = customers.find(c => c.id === pickup.customerId);
          const driver = drivers.find(d => d.id === pickup.driverId);
          const isUrgent = pickup.priority === 'same-day';

          return (
            <Card key={pickup.id} className={isUrgent ? 'border-orange-200 bg-orange-50/50' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">#{pickup.id}</span>
                      <StatusBadge status={pickup.status as any}>{pickup.status}</StatusBadge>
                      {isUrgent && (
                        <Badge variant="destructive" className="text-xs">URGENT</Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground mr-1" />
                        <span className="truncate">{pickup.address}</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Package className="w-4 h-4 mr-1" />
                        <span>{pickup.bagCount} bags • {customer?.username || 'Unknown'}</span>
                      </div>
                      {pickup.specialInstructions && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <FileText className="w-4 h-4 mr-1" />
                          <span className="truncate">{pickup.specialInstructions}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${isUrgent ? 'text-orange-600' : 'text-blue-600'}`}>
                      ${pickup.amount}
                    </span>
                    {driver && (
                      <div className="text-sm text-muted-foreground">
                        Assigned to {driver.username}
                      </div>
                    )}
                  </div>
                </div>
                
                {pickup.status === 'pending' && !pickup.driverId && (
                  <div className="flex items-center gap-2 pt-3 border-t">
                    <span className="text-sm text-muted-foreground">Assign to:</span>
                    <div className="flex gap-2">
                      {drivers.map((driver) => (
                        <Button
                          key={driver.id}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAssignPickup(pickup.id, driver.id)}
                          className="text-xs px-3 py-1 h-7"
                        >
                          {driver.username}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  // Route Optimization
  const renderRoutes = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Route Optimization</h2>
        <Button className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Optimize All Routes
        </Button>
      </div>

      {/* Route Planning Tools */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Subscription Routes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button className="w-full" variant="outline">
                Optimize Weekly Subscription Route
              </Button>
              <div className="text-sm text-muted-foreground">
                {activeSubscriptions.length} active subscriptions ready for optimization
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Package Routes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button className="w-full" variant="outline">
                Optimize One-Time Pickup Route
              </Button>
              <div className="text-sm text-muted-foreground">
                {pendingPickups.length} pending pickups ready for optimization
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Routes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            Today's Routes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {drivers.map((driver) => (
              <div key={driver.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Truck className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="font-semibold">{driver.username}</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Navigation className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  {pickups.filter(p => p.driverId === driver.id && p.status === 'assigned').length} assigned pickups
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // All Members View
  const renderAllMembers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">All Members</h2>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="customer">Customers</SelectItem>
              <SelectItem value="driver">Drivers</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Members Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold">{allMembers.length}</p>
              </div>
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Customers</p>
                <p className="text-2xl font-bold">{allMembers.filter(m => m.role === 'customer').length}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Drivers</p>
                <p className="text-2xl font-bold">{allMembers.filter(m => m.role === 'driver').length}</p>
              </div>
              <Truck className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">With Subscriptions</p>
                <p className="text-2xl font-bold">{allMembers.filter(m => m.hasSubscription).length}</p>
              </div>
              <Package className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      <div className="space-y-4">
        {allMembers
          .filter(member => {
            const matchesSearch = searchTerm === '' || 
              member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
              member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (member.firstName && member.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (member.lastName && member.lastName.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesRole = statusFilter === 'all' || member.role === statusFilter;
            
            return matchesSearch && matchesRole;
          })
          .map((member) => (
            <Card key={member.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{member.username}</span>
                      <StatusBadge status={member.role as any}>{member.role}</StatusBadge>
                      {member.hasSubscription && (
                        <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                          SUBSCRIBED
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">
                        📧 {member.email}
                      </div>
                      {(member.firstName || member.lastName) && (
                        <div className="text-sm text-muted-foreground">
                          👤 {member.firstName} {member.lastName}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        📅 Joined: {new Date(member.createdAt).toLocaleDateString()}
                      </div>
                      {member.lastLoginAt && (
                        <div className="text-sm text-muted-foreground">
                          🕒 Last login: {new Date(member.lastLoginAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">
                      📦 {member.totalPickups} pickups
                    </div>
                    {member.subscriptionStatus !== 'none' && (
                      <div className="text-sm">
                        Status: <span className={member.hasSubscription ? 'text-green-600' : 'text-red-600'}>
                          {member.subscriptionStatus}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        }
      </div>
      
      {allMembers.filter(member => {
        const matchesSearch = searchTerm === '' || 
          member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (member.firstName && member.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (member.lastName && member.lastName.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesRole = statusFilter === 'all' || member.role === statusFilter;
        
        return matchesSearch && matchesRole;
      }).length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No members found matching your search criteria.
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (currentSection) {
      case 'subscribers':
        return renderSubscribers();
      case 'members':
        return renderAllMembers();
      case 'requests':
        return renderRequests();
      case 'routes':
        return renderRoutes();
      case 'reports':
        return <div className="text-center py-8">Reports coming soon...</div>;
      case 'settings':
        return <div className="text-center py-8">Settings coming soon...</div>;
      default:
        return renderDashboard();
    }
  };

  return (
    <MobileLayout 
      currentPage="admin"
      sidebarNavItems={[
        { name: 'Dashboard', path: '/admin', icon: BarChart3 },
        { name: 'Subscribers', path: '/admin/subscribers', icon: Users },
        { name: 'All Members', path: '/admin/members', icon: User },
        { name: 'One-Time Requests', path: '/admin/requests', icon: Package },
        { name: 'Route Optimization', path: '/admin/routes', icon: Navigation },
        { name: 'Reports', path: '/admin/reports', icon: FileText },
        { name: 'Settings', path: '/admin/settings', icon: Settings }
      ]}
    >
      <div className="container mx-auto px-4 py-6">
        {renderContent()}
      </div>
    </MobileLayout>
  );
}