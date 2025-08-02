import { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { authenticatedRequest } from '@/lib/auth';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  AlertCircle,
  Shield
} from 'lucide-react';

interface StripePaymentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientSecret: string;
  amount: number;
  serviceType: 'subscription' | 'one-time';
  testMode?: boolean;
}

export default function StripePaymentForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  clientSecret,
  amount,
  serviceType,
  testMode = false
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      toast({
        title: "Payment Error",
        description: "Payment system not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setPaymentResult(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/payment/success',
        },
        redirect: 'if_required'
      });

      if (error) {
        setPaymentResult({
          success: false,
          message: error.message || "Payment failed",
          details: error
        });
        
        toast({
          title: "Payment Failed",
          description: error.message || "Please check your payment details and try again.",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setPaymentResult({
          success: true,
          message: "Payment successful! Your booking has been confirmed.",
          details: paymentIntent
        });
        
        // If this is a subscription, confirm the subscription payment
        if (serviceType === 'subscription') {
          try {
            await authenticatedRequest('POST', '/api/confirm-subscription-payment', {
              paymentIntentId: paymentIntent.id
            });
          } catch (confirmError) {
            console.error('Error confirming subscription:', confirmError);
          }
        }
        
        toast({
          title: "Payment Successful",
          description: "Your booking has been confirmed!",
        });
        
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setPaymentResult({
          success: false,
          message: "Payment was not completed successfully",
          details: paymentIntent
        });
        
        toast({
          title: "Payment Incomplete",
          description: "Payment was not completed. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setPaymentResult({
        success: false,
        message: error.message || "Payment processing failed",
        details: error
      });
      
      toast({
        title: "Payment Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Complete Payment
            {testMode && (
              <div className="flex items-center gap-1 text-sm text-blue-600">
                <Shield className="w-4 h-4" />
                Test Mode
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service</span>
                <span className="font-medium">
                  {serviceType === 'subscription' ? 'Monthly Subscription' : 'One-Time Pickup'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">${amount.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-2xl font-bold">${amount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          {!paymentResult && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <PaymentElement 
                    options={{
                      layout: 'tabs'
                    }}
                  />
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!stripe || isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay $${amount.toFixed(2)}`
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Payment Result */}
          {paymentResult && (
            <Card className={paymentResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  {paymentResult.success ? (
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                  ) : (
                    <XCircle className="w-12 h-12 text-red-600 mx-auto" />
                  )}
                  
                  <div>
                    <h3 className={`text-lg font-semibold ${paymentResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {paymentResult.success ? 'Payment Successful!' : 'Payment Failed'}
                    </h3>
                    <p className={`text-sm ${paymentResult.success ? 'text-green-600' : 'text-red-600'}`}>
                      {paymentResult.message}
                    </p>
                  </div>
                  
                  {!paymentResult.success && (
                    <Button
                      onClick={() => setPaymentResult(null)}
                      variant="outline"
                      className="mt-4"
                    >
                      Try Again
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Notice */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>Your payment is secured by Stripe. We never store your card information.</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}