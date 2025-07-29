import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
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
  User,
  History,
  DollarSign,
  ArrowRight
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
import { useToast } from '@/hooks/use-toast';
import type { Pickup, Subscription, User as UserType } from '@shared/schema';

export default function Dashboard() {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<'subscription' | 'one-time'>('one-time');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Check for success parameter in URL
  useEffect(() => {
    const isSubscriptionSuccess = window.location.search.includes('success=true');
    if (isSubscriptionSuccess && !showSuccessMessage) {
      setShowSuccessMessage(true);
      // Clear the URL parameter
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [showSuccessMessage]);

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ['/api/me'],
    queryFn: () => authenticatedRequest('GET', '/api/me').then(res => res.json() as Promise<UserType>),
  });

  // Fetch pickups
  const { data: pickups = [] } = useQuery({
    queryKey: ['/api/pickups'],
    queryFn: () => authenticatedRequest('GET', '/api/pickups').then(res => res.json() as Promise<Pickup[]>),
  });

  // Fetch subscription
  const { data: subscription } = useQuery({
    queryKey: ['/api/subscription'],
    queryFn: () => authenticatedRequest('GET', '/api/subscription').then(res => res.json() as Promise<Subscription>),
  });

  const upcomingPickups = pickups
    .filter(p => p.status === 'pending' || p.status === 'assigned')
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  const completedPickups = pickups.filter(p => p.status === 'completed');
  const hasActiveSubscription = subscription && subscription.status === 'active';

  const handleBooking = (type: 'subscription' | 'one-time') => {
    // Check if user already has an active subscription
    if (type === 'subscription' && hasActiveSubscription) {
      toast({
        title: "Subscription Already Active",
        description: "You already have an active weekly subscription. Manage your existing subscription instead.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedServiceType(type);
    setShowBookingModal(true);
  };

  // Success Confirmation Modal
  const SuccessModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <MobileCard className="max-w-sm w-full bg-white p-6 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-green-600 mb-2">You're all set!</h2>
        <p className="text-gray-600 mb-6">
          Welcome to weekly pickup service! Your first pickup will be scheduled soon.
        </p>
        <MobileButton 
          onClick={() => setShowSuccessMessage(false)}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          Continue to Dashboard
        </MobileButton>
      </MobileCard>
    </div>
  );

  return (
    <>
      {showSuccessMessage && <SuccessModal />}
    <MobileLayout 
      title="Dashboard" 
      rightAction={
        <Button variant="ghost" size="sm" className="p-2" onClick={() => setLocation('/settings')}>
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
        <div className="grid grid-cols-3 gap-4 mb-6">
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
          <MobileCard className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {hasActiveSubscription ? 'Active' : 'None'}
            </div>
            <div className="text-sm text-muted-foreground">
              Subscription
            </div>
          </MobileCard>
        </div>

        {/* Subscription Status Card */}
        <MobileCard className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">Subscription Status</h3>
            </div>
            {hasActiveSubscription && (
              <StatusBadge status="active">Active</StatusBadge>
            )}
          </div>
          
          {hasActiveSubscription ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Weekly pickup service - $25/month
              </p>
              <p className="text-sm font-medium">
                Next pickup: {subscription?.nextPickupDate ? 
                  new Date(subscription.nextPickupDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  }) : 'Scheduling...'
                }
              </p>
              <div className="flex space-x-2">
                <MobileButton 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setLocation('/billing')}
                >
                  Manage Subscription
                </MobileButton>
                <MobileButton 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setLocation('/pickup-history')}
                >
                  View History
                </MobileButton>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                No active subscription. Start a weekly pickup service for convenient trash collection.
              </p>
              <MobileButton 
                variant="primary" 
                size="sm" 
                onClick={() => handleBooking('subscription')}
              >
                Start Subscription
              </MobileButton>
            </div>
          )}
        </MobileCard>

        {/* Quick Actions */}
        <MobileCard className="mb-8">
          <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <MobileButton 
              variant="outline" 
              className="flex-col h-24 min-h-[44px]"
              onClick={() => setLocation('/pickup-history')}
            >
              <History className="w-6 h-6 mb-2" />
              <span className="text-sm">Pickup History</span>
            </MobileButton>
            <MobileButton 
              variant="outline" 
              className="flex-col h-24 min-h-[44px]"
              onClick={() => setLocation('/billing')}
            >
              <CreditCard className="w-6 h-6 mb-2" />
              <span className="text-sm">Billing</span>
            </MobileButton>
            <MobileButton 
              variant="outline" 
              className="flex-col h-24 min-h-[44px]"
              onClick={() => setLocation('/settings')}
            >
              <Settings className="w-6 h-6 mb-2" />
              <span className="text-sm">Settings</span>
            </MobileButton>
            <MobileButton 
              variant="outline" 
              className="flex-col h-24 min-h-[44px]"
              onClick={() => handleBooking('one-time')}
            >
              <Plus className="w-6 h-6 mb-2" />
              <span className="text-sm">Book Pickup</span>
            </MobileButton>
          </div>
        </MobileCard>

        {/* Upcoming Pickup Card */}
        <MobileCard className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-lg">Upcoming Pickup</h3>
            </div>
          </div>
          
          {upcomingPickups.length > 0 ? (
            <div className="space-y-3">
              {upcomingPickups.slice(0, 1).map((pickup) => (
                <div key={pickup.id} className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">
                        {pickup.scheduledDate ? 
                          new Date(pickup.scheduledDate).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'short', 
                            day: 'numeric' 
                          }) : 'Date pending'
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {pickup.bagCount} bags • {pickup.serviceType}
                      </p>
                    </div>
                    <StatusBadge status={pickup.status}>
                      {pickup.status === 'assigned' ? 'Scheduled' : pickup.status}
                    </StatusBadge>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-1" />
                    {pickup.address}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-2">
                No pickups scheduled — we'll be out as soon as you need us!
              </p>
              <MobileButton 
                variant="primary" 
                size="sm" 
                onClick={() => handleBooking('one-time')}
              >
                Book Now
              </MobileButton>
            </div>
          )}
        </MobileCard>

        {/* Recent Activity */}
        <MobileCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Recent Activity</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/pickup-history')}
            >
              View All
            </Button>
          </div>
          
          {completedPickups.length > 0 ? (
            <div className="space-y-3">
              {completedPickups.slice(0, 3).map((pickup) => (
                <div key={pickup.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">{pickup.bagCount} bags collected</p>
                      <p className="text-sm text-muted-foreground">
                        {pickup.scheduledDate ? new Date(pickup.scheduledDate).toLocaleDateString() : 'Date pending'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status="completed">
                    Completed
                  </StatusBadge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No recent activity</p>
              <p className="text-sm text-muted-foreground mt-2">
                Book your first pickup to get started!
              </p>
            </div>
          )}
        </MobileCard>
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
    </>
  );
}