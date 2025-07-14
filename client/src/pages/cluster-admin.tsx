import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, 
  Users, 
  DollarSign, 
  Clock, 
  Navigation, 
  CheckCircle,
  AlertCircle,
  Truck,
  RefreshCw
} from "lucide-react";

interface CustomerAddress {
  customerId: number;
  username: string;
  email: string;
  address: string;
  coordinates: [number, number];
  subscriptionType: string;
  lastPickup?: string;
  bagCount: number;
}

interface AddressCluster {
  id: string;
  name: string;
  addresses: CustomerAddress[];
  centroid: [number, number];
  totalCustomers: number;
  estimatedRevenue: number;
  lastPickupDate?: string;
  status: 'available' | 'scheduled' | 'completed';
}

interface ClusterStats {
  totalClusters: number;
  totalCustomers: number;
  totalRevenue: number;
  availableClusters: number;
  completedToday: number;
}

export default function ClusterAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCluster, setSelectedCluster] = useState<AddressCluster | null>(null);

  // Fetch address clusters
  const { data: clusterData, isLoading: clustersLoading } = useQuery({
    queryKey: ['/api/admin/address-clusters'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const clusters: AddressCluster[] = clusterData?.clusters || [];
  const stats: ClusterStats = clusterData?.stats || {
    totalClusters: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    availableClusters: 0,
    completedToday: 0
  };

  // Fetch available drivers
  const { data: drivers = [] } = useQuery({
    queryKey: ['/api/admin/drivers'],
  });

  // Optimize cluster route mutation
  const optimizeClusterMutation = useMutation({
    mutationFn: async ({ clusterId, driverId }: { clusterId: string; driverId?: number }) => {
      return apiRequest('POST', '/api/admin/optimize-cluster-route', { clusterId, driverId });
    },
    onSuccess: (data) => {
      toast({
        title: "Route Optimized!",
        description: `Created ${data.totalStops} pickup stops with $${data.estimatedRevenue} estimated revenue`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/address-clusters'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pickups'] });
      setSelectedCluster(null);
    },
    onError: (error: any) => {
      toast({
        title: "Optimization Failed",
        description: error.message || "Could not optimize cluster route",
        variant: "destructive",
      });
    },
  });

  const handleOptimizeCluster = (cluster: AddressCluster, driverId?: number) => {
    optimizeClusterMutation.mutate({ clusterId: cluster.id, driverId });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-4 h-4" />;
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (clustersLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Geographic Route Planning</h1>
          <p className="text-muted-foreground">
            Group customers by location for efficient pickup routes
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-primary">{stats.totalClusters}</div>
                <div className="text-sm text-muted-foreground">Clusters</div>
              </div>
              <MapPin className="w-8 h-8 text-primary" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.totalCustomers}</div>
                <div className="text-sm text-muted-foreground">Total Customers</div>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">${stats.totalRevenue}</div>
                <div className="text-sm text-muted-foreground">Est. Revenue</div>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.availableClusters}</div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.completedToday}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
          </Card>
        </div>

        {/* Cluster Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {clusters.map((cluster) => (
            <Card key={cluster.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">{cluster.name}</h3>
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cluster.status)}`}>
                    {getStatusIcon(cluster.status)}
                    {cluster.status}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCluster(selectedCluster?.id === cluster.id ? null : cluster)}
                >
                  <MapPin className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Customers</span>
                  <span className="font-medium">{cluster.totalCustomers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Est. Revenue</span>
                  <span className="font-medium text-green-600">${cluster.estimatedRevenue}</span>
                </div>
                {cluster.lastPickupDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Pickup</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(cluster.lastPickupDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {cluster.status === 'available' && (
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => handleOptimizeCluster(cluster)}
                    disabled={optimizeClusterMutation.isPending}
                  >
                    {optimizeClusterMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Navigation className="w-4 h-4 mr-2" />
                    )}
                    Optimize Route
                  </Button>
                  
                  {drivers.length > 0 && (
                    <div className="flex gap-1">
                      {drivers.slice(0, 3).map((driver: any) => (
                        <Button
                          key={driver.id}
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => handleOptimizeCluster(cluster, driver.id)}
                          disabled={optimizeClusterMutation.isPending}
                        >
                          <Truck className="w-3 h-3 mr-1" />
                          {driver.username}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Expanded cluster details */}
              {selectedCluster?.id === cluster.id && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="font-medium mb-3">Customer Addresses ({cluster.addresses.length})</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {cluster.addresses.map((address) => (
                      <div key={address.customerId} className="flex items-start gap-2 p-2 bg-muted/50 rounded">
                        <MapPin className="w-3 h-3 text-muted-foreground mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{address.username}</div>
                          <div className="text-xs text-muted-foreground truncate">{address.address}</div>
                          <div className="text-xs text-muted-foreground">{address.bagCount} bags</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {clusters.length === 0 && !clustersLoading && (
          <Card className="p-8 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Customer Clusters Found</h3>
            <p className="text-muted-foreground mb-4">
              No customers with addresses available for clustering. 
            </p>
            <p className="text-sm text-muted-foreground">
              Customers need to have addresses in their profiles to appear in geographic clusters.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}