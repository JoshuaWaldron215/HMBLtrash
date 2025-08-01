import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { authenticatedRequest } from '@/lib/auth';
import { 
  Play, 
  Pause, 
  X, 
  User, 
  CreditCard, 
  Calendar,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import type { Subscription, User } from '@shared/schema';

interface SubscriptionWithUser extends Subscription {
  user?: User;
}

export default function SubscriptionManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all subscriptions
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['/api/admin/subscriptions'],
    queryFn: () => authenticatedRequest('GET', '/api/admin/subscriptions').then(res => res.json() as Promise<SubscriptionWithUser[]>),
  });

  // Pause subscription mutation
  const pauseMutation = useMutation({
    mutationFn: (subscriptionId: number) => 
      authenticatedRequest('POST', `/api/admin/subscription/${subscriptionId}/pause`),
    onSuccess: () => {
      toast({
        title: "Subscription Paused",
        description: "The subscription has been paused successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscriptions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to pause subscription",
        variant: "destructive",
      });
    },
  });

  // Resume subscription mutation
  const resumeMutation = useMutation({
    mutationFn: (subscriptionId: number) => 
      authenticatedRequest('POST', `/api/admin/subscription/${subscriptionId}/resume`),
    onSuccess: () => {
      toast({
        title: "Subscription Resumed",
        description: "The subscription has been resumed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscriptions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resume subscription",
        variant: "destructive",
      });
    },
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: (subscriptionId: number) => 
      authenticatedRequest('POST', `/api/admin/subscription/${subscriptionId}/cancel`),
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "The subscription has been cancelled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscriptions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'incomplete': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAction = (action: 'pause' | 'resume' | 'cancel', subscriptionId: number) => {
    const confirmMessage = {
      pause: 'Are you sure you want to pause this subscription?',
      resume: 'Are you sure you want to resume this subscription?',
      cancel: 'Are you sure you want to cancel this subscription? This action cannot be undone.'
    };

    if (window.confirm(confirmMessage[action])) {
      switch (action) {
        case 'pause':
          pauseMutation.mutate(subscriptionId);
          break;
        case 'resume':
          resumeMutation.mutate(subscriptionId);
          break;
        case 'cancel':
          cancelMutation.mutate(subscriptionId);
          break;
      }
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Subscription Management
        </CardTitle>
        <CardDescription>
          Manage customer subscriptions - pause, resume, or cancel as needed
        </CardDescription>
      </CardHeader>
      <CardContent>
        {subscriptions.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No subscriptions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((subscription) => (
              <div key={subscription.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">
                        Customer ID: {subscription.customerId}
                      </span>
                      <Badge className={getStatusColor(subscription.status)}>
                        {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span>Amount: ${subscription.amount}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Frequency: {subscription.frequency}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Next: {subscription.nextPickupDate ? 
                            new Date(subscription.nextPickupDate).toLocaleDateString() : 
                            'Not scheduled'
                          }
                        </span>
                      </div>
                    </div>

                    {subscription.stripeSubscriptionId && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-500">
                          Stripe ID: {subscription.stripeSubscriptionId}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {subscription.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction('pause', subscription.id)}
                        disabled={pauseMutation.isPending}
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Pause
                      </Button>
                    )}
                    
                    {subscription.status === 'paused' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction('resume', subscription.id)}
                        disabled={resumeMutation.isPending}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Resume
                      </Button>
                    )}
                    
                    {(subscription.status === 'active' || subscription.status === 'paused') && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleAction('cancel', subscription.id)}
                        disabled={cancelMutation.isPending}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Subscription Management
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                • Pausing a subscription will stop future billing while keeping the customer's data
                <br />
                • Resuming will restart the billing cycle from the next scheduled date
                <br />
                • Cancelling is permanent and cannot be undone
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}