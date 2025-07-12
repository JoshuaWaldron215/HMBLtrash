import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  CreditCard, 
  Smartphone, 
  Banknote, 
  CheckCircle,
  Plus,
  Settings,
  DollarSign,
  Calendar
} from 'lucide-react';
import { useLocation } from 'wouter';
import MobileLayout, { 
  MobileCard, 
  MobileButton, 
  MobileSection 
} from '@/components/mobile-layout';
import { Button } from '@/components/ui/button';
import { authenticatedRequest } from '@/lib/auth';
import type { Pickup, Subscription, User as UserType } from '@shared/schema';

export default function Billing() {
  const [, setLocation] = useLocation();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'venmo' | 'cashapp'>('stripe');

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ['/api/me'],
    queryFn: () => authenticatedRequest('GET', '/api/me').then(res => res.json() as Promise<UserType>),
  });

  // Fetch subscription
  const { data: subscription } = useQuery({
    queryKey: ['/api/subscription'],
    queryFn: () => authenticatedRequest('GET', '/api/subscription').then(res => res.json() as Promise<Subscription>),
  });

  // Fetch recent pickups for billing history
  const { data: pickups = [] } = useQuery({
    queryKey: ['/api/pickups'],
    queryFn: () => authenticatedRequest('GET', '/api/pickups').then(res => res.json() as Promise<Pickup[]>),
  });

  const completedPickups = pickups.filter(p => p.status === 'completed' && p.amount);
  const totalSpent = completedPickups.reduce((sum, pickup) => sum + (pickup.amount || 0), 0);

  const paymentMethods = [
    {
      id: 'stripe' as const,
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Secure payment with Stripe',
      available: true
    },
    {
      id: 'venmo' as const,
      name: 'Venmo',
      icon: Smartphone,
      description: 'Pay with Venmo',
      available: false // Will be implemented later
    },
    {
      id: 'cashapp' as const,
      name: 'Cash App',
      icon: Banknote,
      description: 'Pay with Cash App',
      available: false // Will be implemented later
    }
  ];

  return (
    <MobileLayout 
      title="Billing"
      showBackButton={true}
      onBack={() => setLocation('/dashboard')}
    >
      <MobileSection className="pt-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Billing & Payments</h1>
          <p className="text-muted-foreground">
            Manage your payment methods and view billing history
          </p>
        </div>

        {/* Billing Summary */}
        <MobileCard className="mb-6">
          <h3 className="font-semibold text-lg mb-4">Billing Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                ${totalSpent.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Spent
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {completedPickups.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Completed Pickups
              </div>
            </div>
          </div>
          
          {subscription && subscription.status === 'active' && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-800">Active Subscription</p>
                  <p className="text-sm text-green-600">Weekly Pickup - $20/month</p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          )}
        </MobileCard>

        {/* Payment Methods */}
        <MobileCard className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Payment Methods</h3>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Manage
            </Button>
          </div>

          <div className="space-y-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <div
                  key={method.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPaymentMethod === method.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => method.available && setSelectedPaymentMethod(method.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5" />
                      <div>
                        <p className="font-medium">{method.name}</p>
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                      </div>
                    </div>
                    {selectedPaymentMethod === method.id && method.available && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                    {!method.available && (
                      <span className="text-xs text-muted-foreground">Coming Soon</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <MobileButton 
            variant="outline" 
            className="w-full mt-4"
            onClick={() => {
              // TODO: Implement add payment method
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Payment Method
          </MobileButton>
        </MobileCard>

        {/* Recent Transactions */}
        <MobileCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Recent Transactions</h3>
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
              {completedPickups.slice(0, 5).map((pickup) => (
                <div key={pickup.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{pickup.bagCount} bags pickup</p>
                      <p className="text-sm text-muted-foreground">
                        {pickup.scheduledDate ? 
                          new Date(pickup.scheduledDate).toLocaleDateString() : 
                          'Date pending'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${pickup.amount}</p>
                    <p className="text-sm text-muted-foreground">{pickup.serviceType}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No transactions yet</p>
            </div>
          )}
        </MobileCard>
      </MobileSection>
    </MobileLayout>
  );
}