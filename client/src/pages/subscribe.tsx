import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { authenticatedRequest } from "@/lib/auth";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      localStorage.removeItem('bookingData');
      setLocation('/dashboard?success=true');
    }
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-service-primary text-white hover:bg-service-accent"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Subscribe Now"
        )}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [bookingData, setBookingData] = useState<any>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const data = localStorage.getItem('bookingData');
    if (!data) {
      toast({
        title: "No booking data found",
        description: "Please start a new booking.",
        variant: "destructive",
      });
      setLocation('/');
      return;
    }

    const booking = JSON.parse(data);
    setBookingData(booking);

    // Create subscription as soon as the page loads
    authenticatedRequest("POST", "/api/create-subscription")
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        // Handle the case where user already has an active subscription
        if (error.message.includes("already has an active subscription")) {
          toast({
            title: "Subscription Already Active",
            description: "You already have an active weekly subscription. Redirecting to dashboard...",
            variant: "destructive",
          });
          localStorage.removeItem('bookingData');
          setTimeout(() => setLocation('/dashboard'), 2000);
          return;
        }
        
        toast({
          title: "Subscription setup failed",
          description: error.message,
          variant: "destructive",
        });
      });
  }, []);

  if (!clientSecret || !bookingData) {
    return (
      <div className="min-h-screen bg-service-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-service-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-service-text">Setting up subscription...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-service-background py-12 px-4">
      <div className="max-w-md mx-auto">
        <Card className="bg-white shadow-lg">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Trash2 className="h-8 w-8 text-service-primary mr-2" />
              <div>
                <h1 className="text-xl font-bold text-service-text">Acapella Trash Removal</h1>
                <p className="text-xs text-service-secondary">powered by HMBL</p>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-service-text">
              Subscribe to Weekly Pickup
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Subscription Summary */}
            <div className="mb-6 p-4 bg-service-background rounded-lg">
              <h3 className="font-semibold text-service-text mb-2">Subscription Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-service-secondary">Service:</span>
                  <span className="text-service-text">Weekly Trash Pickup</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-service-secondary">Frequency:</span>
                  <span className="text-service-text">Every week</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-service-secondary">Address:</span>
                  <span className="text-service-text">{bookingData.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-service-secondary">First Pickup:</span>
                  <span className="text-service-text">{bookingData.scheduledDate}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span className="text-service-text">Monthly Cost:</span>
                  <span className="text-service-primary">$25/month</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  You can cancel your subscription at any time. Your first pickup will be scheduled within 7 days.
                </p>
              </div>
            </div>

            {/* Payment Form */}
            {stripePromise ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <SubscribeForm />
              </Elements>
            ) : (
              <div className="text-center p-6 bg-yellow-50 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Payment Setup Required</h3>
                <p className="text-yellow-700 mb-4">
                  Stripe payment keys need to be configured to process subscriptions.
                </p>
                <Button 
                  onClick={() => {
                    localStorage.removeItem('bookingData');
                    window.location.href = '/dashboard';
                  }}
                  className="bg-service-primary text-white hover:bg-service-accent"
                >
                  Return to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
