import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, CreditCard, Loader2, Star } from 'lucide-react';

// Make sure to call `loadStripe` outside of a component's render to avoid recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Subscription plans with their Stripe price IDs (you'll need to create these in Stripe Dashboard)
const SUBSCRIPTION_PLANS = [
  {
    id: 'basic',
    name: 'Basic Package',
    price: 35,
    priceId: 'price_basic_weekly', // Replace with actual Stripe Price ID
    description: 'Perfect for small households',
    features: ['Up to 3 bags per week', 'Standard pickup', 'Email notifications'],
    popular: false
  },
  {
    id: 'clean_carry',
    name: 'Clean & Carry Package',
    price: 60,
    priceId: 'price_clean_carry_weekly', // Replace with actual Stripe Price ID
    description: 'Enhanced service for busy families',
    features: ['Up to 5 bags per week', 'Priority pickup', 'SMS notifications', 'Weekend availability'],
    popular: true
  },
  {
    id: 'heavy_duty',
    name: 'Heavy Duty Package',
    price: 75,
    priceId: 'price_heavy_duty_weekly', // Replace with actual Stripe Price ID
    description: 'For larger households and businesses',
    features: ['Up to 8 bags per week', 'Same-day pickup', 'Bulk item removal', 'Dedicated support'],
    popular: false
  },
  {
    id: 'premium',
    name: 'Premium Property Package',
    price: 150,
    priceId: 'price_premium_weekly', // Replace with actual Stripe Price ID
    description: 'Complete property management solution',
    features: ['Unlimited bags', 'Daily pickup available', 'Yard waste removal', 'Property maintenance', 'Premium support'],
    popular: false
  }
];

const SubscribeForm = ({ selectedPlan, subscriptionDetails, onSuccess }: { 
  selectedPlan: typeof SUBSCRIPTION_PLANS[0]; 
  subscriptionDetails: any;
  onSuccess?: () => void; 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [elementError, setElementError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      // Validate form completion first
      console.log('Validating payment form...');
      const { error: submitError } = await elements.submit();
      if (submitError) {
        console.error('Form validation error:', submitError);
        toast({
          title: "Please Complete All Fields",
          description: submitError.message || "All payment fields are required for live payments",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      console.log('Form validated, confirming payment...');

      // First confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/subscribe/success',
        },
        redirect: 'if_required' // Don't redirect automatically
      });

      if (error) {
        console.error('Payment failed:', error);
        let errorMessage = error.message;
        
        // Enhanced error handling for live payments
        if (error.type === 'validation_error') {
          errorMessage = "Please fill in all required payment fields including billing address.";
        } else if (error.code === 'incomplete_number') {
          errorMessage = "Please enter a complete card number.";
        } else if (error.code === 'incomplete_cvc') {
          errorMessage = "Please enter a valid security code.";
        } else if (error.code === 'incomplete_expiry') {
          errorMessage = "Please enter a valid expiration date.";
        } else if (error.code === 'card_declined') {
          errorMessage = "Your card was declined. Please try a different payment method.";
        } else if (error.message?.includes('missing information')) {
          errorMessage = "Please complete all required fields including name and billing address.";
        }
        
        toast({
          title: "Payment Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      // Payment succeeded, now confirm with our backend
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        try {
          const confirmResponse = await apiRequest('POST', '/api/confirm-subscription-payment', {
            subscriptionId: subscriptionDetails.subscriptionId,
            packageType: subscriptionDetails.packageType,
            preferredDay: subscriptionDetails.preferredDay,
            preferredTime: subscriptionDetails.preferredTime
          });

          const confirmData = await confirmResponse.json();

          if (confirmData.success) {
            setIsComplete(true);
            toast({
              title: "Subscription Activated!",
              description: "Welcome to Acapella Trash Removal!",
            });
            if (onSuccess) onSuccess();
          } else {
            throw new Error(confirmData.message || 'Failed to activate subscription');
          }
        } catch (confirmError: any) {
          toast({
            title: "Activation Failed",
            description: "Payment succeeded but subscription activation failed. Contact support.",
            variant: "destructive",
          });
          console.error('Subscription confirmation failed:', confirmError);
        }
      } else {
        toast({
          title: "Payment Incomplete",
          description: "Payment was not fully processed. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Subscription Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isComplete) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-green-600 mb-2">Subscription Active!</h2>
        <p className="text-gray-600 mb-4">Your {selectedPlan.name} is now active.</p>
        <p className="text-sm text-gray-500">You'll receive a confirmation email with your pickup schedule.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">Subscription Details</h3>
        </div>
        <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
          <p>Plan: <span className="font-bold">{selectedPlan.name}</span></p>
          <p>Monthly: <span className="font-bold">${selectedPlan.price.toFixed(2)}</span></p>
          <p>First payment today, then monthly thereafter</p>
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-sm">Live Payment Mode</span>
          </div>
          <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
            All fields including billing address are required for live payments.
          </p>
        </div>
        
        <PaymentElement 
          options={{
            fields: {
              billingDetails: {
                name: 'auto',
                email: 'auto',
                phone: 'never',
                address: {
                  country: 'auto',
                  line1: 'auto',
                  line2: 'never',
                  city: 'auto',
                  state: 'auto',
                  postalCode: 'auto'
                }
              }
            },
            wallets: {
              applePay: 'never',
              googlePay: 'never'
            }
          }}
          onChange={(event) => {
            console.log('PaymentElement status:', {
              complete: event.complete,
              empty: event.empty
            });
            setElementError(null);
          }}
        />
        {elementError && (
          <div className="mt-2 text-sm text-red-600">
            {elementError}
          </div>
        )}
      </div>

      <Button 
        type="submit" 
        disabled={!stripe || isLoading} 
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Setting up subscription...
          </>
        ) : (
          `Subscribe for $${selectedPlan.price.toFixed(2)}/month`
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Cancel anytime. Your payment is secured by Stripe. We never store your card information.
      </p>
    </form>
  );
};

const PlanSelector = ({ selectedPlan, onSelectPlan }: {
  selectedPlan: string;
  onSelectPlan: (planId: string) => void;
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      {SUBSCRIPTION_PLANS.map((plan) => (
        <Card 
          key={plan.id} 
          className={`cursor-pointer transition-all duration-200 ${
            selectedPlan === plan.id 
              ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'hover:shadow-md'
          } ${plan.popular ? 'border-yellow-400' : ''}`}
          onClick={() => onSelectPlan(plan.id)}
        >
          <CardHeader className="relative">
            {plan.popular && (
              <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-black">
                <Star className="w-3 h-3 mr-1" />
                Popular
              </Badge>
            )}
            <CardTitle className="flex items-center justify-between">
              {plan.name}
              <span className="text-2xl font-bold">${plan.price}</span>
            </CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default function SubscribePage() {
  const [clientSecret, setClientSecret] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState('clean_carry'); // Default to popular plan
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [, setLocation] = useLocation();

  const selectedPlan = SUBSCRIPTION_PLANS.find(plan => plan.id === selectedPlanId)!;

  const handleProceedToPayment = async () => {
    setLoading(true);
    
    try {
      // Create subscription with Stripe
      const response = await apiRequest('POST', '/api/create-subscription', { 
        priceId: selectedPlan.priceId,
      });
      const data = await response.json();
      
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setSubscriptionDetails({
          subscriptionId: data.subscriptionId,
          packageType: data.packageType,
          preferredDay: data.preferredDay || 'monday',
          preferredTime: data.preferredTime || 'morning'
        });
        setShowPayment(true);
      } else if (data.message) {
        toast({
          title: "Already Subscribed",
          description: data.message,
        });
      }
    } catch (error: any) {
      toast({
        title: "Setup Failed",
        description: error.message || "Unable to set up subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const { toast } = useToast();

  if (showPayment && clientSecret) {
    const appearance = {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#1e3a8a',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '8px'
      },
    };

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-md mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Complete Subscription
              </CardTitle>
              <CardDescription>
                {selectedPlan.name} - ${selectedPlan.price}/month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret,
                  appearance
                }}
              >
                <SubscribeForm 
                  selectedPlan={selectedPlan}
                  subscriptionDetails={subscriptionDetails}
                  onSuccess={() => {
                    setTimeout(() => setLocation('/'), 3000);
                  }}
                />
              </Elements>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Choose Your Subscription Plan
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Reliable trash pickup service for the Philadelphia metro area
          </p>
        </div>

        <PlanSelector 
          selectedPlan={selectedPlanId}
          onSelectPlan={setSelectedPlanId}
        />

        <div className="text-center">
          <Button 
            size="lg" 
            onClick={handleProceedToPayment}
            disabled={loading}
            className="px-8"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Setting up...
              </>
            ) : (
              `Continue with ${selectedPlan.name}`
            )}
          </Button>
          
          <div className="mt-4 text-sm text-gray-500">
            <p>✓ Cancel anytime</p>
            <p>✓ No setup fees</p>
            <p>✓ Secure payment with Stripe</p>
          </div>
        </div>
      </div>
    </div>
  );
}