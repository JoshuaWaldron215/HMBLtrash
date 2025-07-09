import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Package, 
  Plus, 
  CheckCircle,
  AlertCircle,
  Truck,
  Star,
  CreditCard,
  Settings,
  Bell,
  User
} from 'lucide-react';
import MobileLayout, { 
  MobileCard, 
  MobileButton, 
  MobileSection, 
  StatusBadge, 
  FloatingActionButton 
} from '@/components/mobile-layout';
import BookingModal from '@/components/booking-modal';
import { authenticatedRequest } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import type { Pickup, Subscription, User as UserType } from '@shared/schema';

export default function Dashboard() {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<'subscription' | 'one-time'>('one-time');

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ['/api/me'],
    queryFn: () => authenticatedRequest('/api/me').then(res => res.json() as Promise<UserType>),
  });

  // Fetch pickups
  const { data: pickups = [] } = useQuery({
    queryKey: ['/api/pickups'],
    queryFn: () => authenticatedRequest('/api/pickups').then(res => res.json() as Promise<Pickup[]>),
  });

  // Fetch subscription
  const { data: subscription } = useQuery({
    queryKey: ['/api/subscription'],
    queryFn: () => authenticatedRequest('/api/subscription').then(res => res.json() as Promise<Subscription>),
  });

  const upcomingPickups = pickups.filter(p => p.status === 'pending' || p.status === 'assigned');
  const completedPickups = pickups.filter(p => p.status === 'completed');
  const nextPickup = upcomingPickups[0];

  const handleBooking = (type: 'subscription' | 'one-time') => {
    setSelectedServiceType(type);
    setShowBookingModal(true);
  };

  return (
    <MobileLayout 
      title="Dashboard" 
      rightAction={
        <Button variant="ghost" size="sm" className="p-2">
          <User className="w-5 h-5" />
        </Button>
      }
    >
      {/* Welcome Section */}
      <MobileSection className="pt-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-muted-foreground">
            Manage your trash pickup service
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <MobileCard className="text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {upcomingPickups.length}
            </div>
            <div className="text-sm text-muted-foreground">
              Upcoming Pickups
            </div>
          </MobileCard>
          <MobileCard className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {completedPickups.length}
            </div>
            <div className="text-sm text-muted-foreground">
              Completed
            </div>
          </MobileCard>
        </div>

        {/* Next Pickup Card */}
        {nextPickup ? (
          <MobileCard className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg mb-1">Next Pickup</h3>
                <p className="text-sm text-muted-foreground">
                  {nextPickup.scheduledDate ? 
                    new Date(nextPickup.scheduledDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    }) : 
                    'Date pending'
                  }
                </p>
              </div>
              <StatusBadge status={nextPickup.status as any}>
                {nextPickup.status === 'pending' && 'Scheduled'}
                {nextPickup.status === 'assigned' && 'En Route'}
                {nextPickup.status === 'completed' && 'Completed'}
              </StatusBadge>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground mr-2" />
                <span>{nextPickup.address}</span>
              </div>
              <div className="flex items-center text-sm">
                <Package className="w-4 h-4 text-muted-foreground mr-2" />
                <span>{nextPickup.bagCount} bags • {nextPickup.serviceType}</span>
              </div>
              {nextPickup.specialInstructions && (
                <div className="flex items-start text-sm">
                  <AlertCircle className="w-4 h-4 text-muted-foreground mr-2 mt-0.5" />
                  <span className="text-muted-foreground">{nextPickup.specialInstructions}</span>
                </div>
              )}
            </div>
          </MobileCard>
        ) : (
          <MobileCard className="text-center mb-6">
            <div className="py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Upcoming Pickups</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Schedule your next pickup to get started
              </p>
              <MobileButton 
                variant="outline" 
                size="sm"
                onClick={() => handleBooking('one-time')}
              >
                Book Now
              </MobileButton>
            </div>
          </MobileCard>
        )}

        {/* Subscription Status */}
        {subscription ? (
          <MobileCard className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Weekly Subscription</h3>
                <p className="text-sm text-muted-foreground">
                  Next pickup: {subscription.nextPickupDate ? 
                    new Date(subscription.nextPickupDate).toLocaleDateString() : 
                    'Pending'
                  }
                </p>
              </div>
              <StatusBadge status={subscription.status === 'active' ? 'completed' : 'pending'}>
                {subscription.status}
              </StatusBadge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">$20/month</span>
              <Button variant="ghost" size="sm" className="text-primary">
                Manage
              </Button>
            </div>
          </MobileCard>
        ) : (
          <MobileCard className="text-center mb-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <div className="py-6">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold mb-2">Upgrade to Weekly Service</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Save time with automatic weekly pickups
              </p>
              <MobileButton 
                variant="success" 
                size="sm"
                onClick={() => handleBooking('subscription')}
              >
                Start Subscription - $20/month
              </MobileButton>
            </div>
          </MobileCard>
        )}
      </MobileSection>

      {/* Recent Pickups */}
      <MobileSection className="bg-muted/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Recent Pickups</h2>
          <Button variant="ghost" size="sm" className="text-primary">
            View All
          </Button>
        </div>

        {pickups.length > 0 ? (
          <div className="space-y-3">
            {pickups.slice(0, 3).map((pickup) => (
              <MobileCard key={pickup.id} className="app-list-item">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {pickup.bagCount} bags • {pickup.serviceType}
                      </span>
                      <StatusBadge status={pickup.status as any}>
                        {pickup.status}
                      </StatusBadge>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>
                        {pickup.scheduledDate ? 
                          new Date(pickup.scheduledDate).toLocaleDateString() : 
                          'Date pending'
                        }
                      </span>
                      <span className="mx-2">•</span>
                      <span>${pickup.amount}</span>
                    </div>
                  </div>
                </div>
              </MobileCard>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Pickups Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Book your first pickup to get started
            </p>
            <MobileButton 
              variant="outline"
              onClick={() => handleBooking('one-time')}
            >
              Book First Pickup
            </MobileButton>
          </div>
        )}
      </MobileSection>

      {/* Quick Actions */}
      <MobileSection>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <MobileButton 
            variant="outline"
            className="flex flex-col items-center space-y-2 h-auto py-4"
            onClick={() => handleBooking('one-time')}
          >
            <Plus className="w-6 h-6" />
            <span>Book Pickup</span>
          </MobileButton>
          
          <MobileButton 
            variant="outline"
            className="flex flex-col items-center space-y-2 h-auto py-4"
            onClick={() => handleBooking('subscription')}
          >
            <Calendar className="w-6 h-6" />
            <span>Subscribe</span>
          </MobileButton>
          
          <MobileButton 
            variant="outline"
            className="flex flex-col items-center space-y-2 h-auto py-4"
          >
            <CreditCard className="w-6 h-6" />
            <span>Billing</span>
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

      {/* Floating Action Button */}
      <FloatingActionButton onClick={() => handleBooking('one-time')}>
        <Plus className="w-6 h-6" />
      </FloatingActionButton>

      {/* Booking Modal */}
      <BookingModal 
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        serviceType={selectedServiceType}
      />
    </MobileLayout>
  );
}