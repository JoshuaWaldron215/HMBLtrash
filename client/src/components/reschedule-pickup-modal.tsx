import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, User, MapPin, Package, X, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { authenticatedRequest } from '@/lib/auth';
import type { Pickup, User as UserType } from '@shared/schema';

interface ReschedulePickupModalProps {
  pickup: Pickup | { id: number; customerId: number; scheduledDate?: string | Date | null; };
  customer: UserType;
  onClose: () => void;
  isOpen: boolean;
  isSubscription?: boolean;
}

export default function ReschedulePickupModal({ 
  pickup, 
  customer, 
  onClose, 
  isOpen,
  isSubscription = false
}: ReschedulePickupModalProps) {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [reason, setReason] = useState('');
  const [shouldEmailCustomer, setShouldEmailCustomer] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const reschedulePickupMutation = useMutation({
    mutationFn: async ({ pickupId, newDate, reason, shouldEmailCustomer }: { pickupId: number; newDate: string; reason: string; shouldEmailCustomer: boolean }) => {
      const endpoint = isSubscription 
        ? `/api/admin/subscriptions/${pickupId}/reschedule`
        : `/api/admin/pickups/${pickupId}/reschedule`;
      
      const response = await authenticatedRequest('POST', endpoint, {
        newDate,
        reason,
        shouldEmailCustomer
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (isSubscription) {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/subscriptions'] });
        let emailStatus = "";
        if (data.emailAttempted) {
          emailStatus = data.emailSent ? "Customer has been notified via email." : "Email notification failed (domain verification needed).";
        } else {
          emailStatus = "Customer was not notified via email.";
        }
        toast({
          title: "Subscription Pickup Rescheduled Successfully",
          description: `Next pickup moved to ${new Date(data.subscription.nextPickupDate).toLocaleDateString()}. ${emailStatus}`,
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/pickups'] });
        let emailStatus = "";
        if (data.emailAttempted) {
          emailStatus = data.emailSent ? "Customer has been notified via email." : "Email notification failed (domain verification needed).";
        } else {
          emailStatus = "Customer was not notified via email.";
        }
        toast({
          title: "Pickup Rescheduled Successfully",
          description: `Pickup moved to ${new Date(data.pickup.scheduledDate).toLocaleDateString()}. ${emailStatus}`,
        });
      }
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Reschedule Failed",
        description: error.message || "Failed to reschedule pickup. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) {
      toast({
        title: "Date Required",
        description: "Please select a new date for the pickup.",
        variant: "destructive",
      });
      return;
    }

    const combinedDateTime = `${newDate}T${newTime}:00.000Z`;
    reschedulePickupMutation.mutate({
      pickupId: pickup.id,
      newDate: combinedDateTime,
      reason,
      shouldEmailCustomer
    });
  };

  if (!isOpen) return null;

  const originalDate = pickup.scheduledDate ? new Date(pickup.scheduledDate) : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {isSubscription ? 'Reschedule Next Pickup' : 'Reschedule Pickup'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Current Pickup Details */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-3">{isSubscription ? 'Subscription Details' : 'Current Pickup Details'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{customer.firstName || customer.username}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{originalDate ? originalDate.toLocaleDateString() : 'Not scheduled'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{customer.address}</span>
              </div>
              {!isSubscription && (
                <>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span>{(pickup as Pickup).bagCount} bags • ${parseFloat((pickup as Pickup).amount?.toString() || '0').toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
            <div className="mt-2">
              <Badge variant="outline">{isSubscription ? 'subscription' : (pickup as Pickup).serviceType}</Badge>
              {!isSubscription && <Badge variant="outline" className="ml-2">{(pickup as Pickup).status}</Badge>}
              {isSubscription && <Badge variant="outline" className="ml-2">Weekly Service</Badge>}
            </div>
          </div>

          {/* Reschedule Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-date">New Date</Label>
                <Input
                  id="new-date"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-time">Preferred Time</Label>
                <Input
                  id="new-time"
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Rescheduling (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Weather conditions, route optimization, customer request..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            {/* Preview of changes */}
            {newDate && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Preview Changes</h4>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3 h-3" />
                    <span>From: {originalDate ? originalDate.toLocaleDateString() : 'Not scheduled'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>To: {new Date(newDate).toLocaleDateString()} at {newTime}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Email notification option */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="email-notification"
                  checked={shouldEmailCustomer}
                  onCheckedChange={(checked) => setShouldEmailCustomer(checked as boolean)}
                />
                <div className="space-y-1">
                  <Label htmlFor="email-notification" className="text-sm font-medium cursor-pointer">
                    Email customer about this reschedule
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Send notification to <strong>{customer.email}</strong> with the new pickup date and reason
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={reschedulePickupMutation.isPending}
                className="flex-1"
              >
                {reschedulePickupMutation.isPending ? 'Rescheduling...' : 'Reschedule Pickup'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}