import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, 
  Package, 
  Clock, 
  MapPin, 
  CheckCircle,
  AlertCircle,
  DollarSign,
  ArrowLeft,
  Filter,
  RotateCcw,
  X
} from 'lucide-react';
import { useLocation } from 'wouter';
import MobileLayout, { 
  MobileCard, 
  MobileSection, 
  StatusBadge,
  MobileButton 
} from '@/components/mobile-layout';
import { authenticatedRequest } from '@/lib/auth';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Pickup } from '@shared/schema';

export default function PickupHistory() {
  const [, setLocation] = useLocation();
  const [activeFilter, setActiveFilter] = useState<'all' | 'subscription' | 'one-time' | 'completed' | 'scheduled'>('all');
  const { toast } = useToast();

  // Fetch pickups
  const { data: pickups = [], isLoading } = useQuery({
    queryKey: ['/api/pickups'],
    queryFn: () => authenticatedRequest('GET', '/api/pickups').then(res => res.json() as Promise<Pickup[]>),
  });

  // Filter pickups based on active filter
  const filteredPickups = pickups.filter(pickup => {
    switch (activeFilter) {
      case 'subscription':
        return pickup.serviceType === 'subscription';
      case 'one-time':
        return pickup.serviceType === 'one-time';
      case 'completed':
        return pickup.status === 'completed';
      case 'scheduled':
        return pickup.status === 'assigned' || pickup.status === 'pending';
      default:
        return true;
    }
  });

  // Sort pickups by date (most recent first)
  const sortedPickups = filteredPickups
    .sort((a, b) => {
      const dateA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0;
      const dateB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0;
      return dateB - dateA;
    });

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'subscription', label: 'Subscription' },
    { key: 'one-time', label: 'One-Time' },
    { key: 'completed', label: 'Completed' },
    { key: 'scheduled', label: 'Scheduled' }
  ];

  const formatDate = (date: string | Date | null) => {
    if (!date) return 'Date pending';
    return new Date(date).toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'assigned':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <MobileLayout 
      title="Pickup History"
      showBackButton={true}
      onBack={() => setLocation('/dashboard')}
    >
      <MobileSection className="pt-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Pickup History</h1>
          <div className="text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded">
            Total Pickups: {pickups.length}
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map((filter) => (
            <Button
              key={filter.key}
              variant={activeFilter === filter.key ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter.key as any)}
              className="text-xs"
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : sortedPickups.length > 0 ? (
          <div className="space-y-4">
            {sortedPickups.map((pickup) => (
              <MobileCard key={pickup.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(pickup.status)}
                    <div>
                      <h3 className="font-semibold text-lg">
                        {pickup.bagCount} bags • {pickup.serviceType}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(pickup.scheduledDate)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={pickup.status as any}>
                    {pickup.status}
                  </StatusBadge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground mr-2" />
                    <span>{pickup.address}</span>
                  </div>
                  
                  {pickup.amount && (
                    <div className="flex items-center text-sm">
                      <DollarSign className="w-4 h-4 text-muted-foreground mr-2" />
                      <span>${pickup.amount}</span>
                    </div>
                  )}
                  
                  {pickup.specialInstructions && (
                    <div className="flex items-start text-sm mt-2 p-2 bg-gray-50 rounded">
                      <AlertCircle className="w-4 h-4 text-muted-foreground mr-2 mt-0.5" />
                      <span className="text-muted-foreground">{pickup.specialInstructions}</span>
                    </div>
                  )}
                  
                  {pickup.completedAt && (
                    <div className="flex items-center text-sm text-green-600 mt-2">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span>
                        Completed on {new Date(pickup.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  {pickup.status === 'completed' && (
                    <div className="mt-3 pt-3 border-t">
                      <MobileButton
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Repeat Pickup",
                            description: "This feature will be available soon! For now, please use the Book Pickup option.",
                          });
                        }}
                        className="w-full"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Repeat This Pickup
                      </MobileButton>
                    </div>
                  )}
                </div>
              </MobileCard>
            ))}
          </div>
        ) : (
          <MobileCard className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Pickup History</h3>
            <p className="text-muted-foreground mb-6">
              You haven't scheduled any pickups yet. Start by booking your first pickup service.
            </p>
            <button 
              onClick={() => setLocation('/dashboard')}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Book First Pickup
            </button>
          </MobileCard>
        )}
      </MobileSection>
    </MobileLayout>
  );
}