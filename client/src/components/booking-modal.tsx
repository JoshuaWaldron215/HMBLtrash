import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, Package, CreditCard, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { authenticatedRequest } from '@/lib/auth';
import { MobileButton, MobileCard, MobileInput } from '@/components/mobile-layout';
import TestPaymentModal from '@/components/test-payment-modal';
import AddressAutocomplete from '@/components/address-autocomplete';
import type { Subscription } from '@shared/schema';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceType?: 'subscription' | 'one-time';
}

const bagPricing = [
  { count: 4, price: 30 },
  { count: 8, price: 45 },
  { count: 10, price: 50 },
  { count: 25, price: 100 }
];

export default function BookingModal({ isOpen, onClose, serviceType = 'one-time' }: BookingModalProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    clientSecret: string;
    amount: number;
    testMode?: boolean;
    testCards?: any;
  } | null>(null);
  const [formData, setFormData] = useState({
    serviceType,
    bagCount: 4,
    scheduledDate: '',
    address: '',
    specialInstructions: ''
  });

  // Set default datetime to tomorrow at 10:00 AM
  useEffect(() => {
    if (!formData.scheduledDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const defaultDateTime = tomorrow.toISOString().slice(0, 16);
      setFormData(prev => ({ ...prev, scheduledDate: defaultDateTime }));
    }
  }, [formData.scheduledDate]);

  // Fetch subscription to check if user already has one
  const { data: subscription } = useQuery({
    queryKey: ['/api/subscription'],
    queryFn: () => authenticatedRequest('GET', '/api/subscription').then(res => res.json() as Promise<Subscription>),
    enabled: serviceType === 'subscription' && isOpen,
  });

  const totalSteps = 3;

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      // Check if user already has an active subscription
      if (serviceType === 'subscription' && subscription && subscription.status === 'active') {
        toast({
          title: "Subscription Already Active",
          description: "You already have an active weekly subscription. Please manage your existing subscription instead.",
          variant: "destructive",
        });
        onClose();
        return;
      }

      const amount = serviceType === 'subscription' ? 25 : 
        bagPricing.find(p => p.count === formData.bagCount)?.price || 30;

      // Create payment intent
      const endpoint = serviceType === 'subscription' ? '/api/create-subscription' : '/api/create-payment-intent';
      const response = await authenticatedRequest('POST', endpoint, 
        serviceType === 'subscription' ? {} : { amount }
      );
      
      const result = await response.json();
      
      // Store booking data for after payment
      localStorage.setItem('bookingData', JSON.stringify({
        ...formData,
        amount,
        serviceType
      }));

      // Show payment modal
      setPaymentData({
        clientSecret: result.clientSecret,
        amount,
        testMode: result.testMode,
        testCards: result.testCards
      });
      setShowPaymentModal(true);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getCurrentPrice = () => {
    if (serviceType === 'subscription') return 20;
    return bagPricing.find(p => p.count === formData.bagCount)?.price || 30;
  };

  const handlePaymentSuccess = async () => {
    try {
      // Create the pickup/subscription after successful payment
      const bookingData = JSON.parse(localStorage.getItem('bookingData') || '{}');
      
      if (serviceType === 'one-time') {
        // Create pickup - server handles data type conversion
        await authenticatedRequest('POST', '/api/pickups', {
          address: bookingData.address,
          bagCount: bookingData.bagCount,
          amount: bookingData.amount.toString(), // Convert to string for decimal field
          serviceType: bookingData.serviceType,
          scheduledDate: bookingData.scheduledDate, // Server will convert string to Date
          specialInstructions: bookingData.specialInstructions || null,
          status: 'pending'
        });
        
        toast({
          title: "Pickup Booked!",
          description: "Your pickup has been scheduled successfully.",
        });
      } else {
        // Subscription was already created during payment
        toast({
          title: "Subscription Active!",
          description: "Your weekly subscription is now active.",
        });
      }
      
      // Clean up
      localStorage.removeItem('bookingData');
      setShowPaymentModal(false);
      onClose();
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "There was an issue finalizing your booking.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-background rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="app-header border-b-0 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold">
              {serviceType === 'subscription' ? 'Weekly Subscription' : 'One-Time Pickup'}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Service</span>
            <span>Details</span>
            <span>Confirm</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Service Details</h3>
                
                {serviceType === 'one-time' && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Number of Bags</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {bagPricing.map((option) => (
                          <button
                            key={option.count}
                            onClick={() => setFormData({...formData, bagCount: option.count})}
                            className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${
                              formData.bagCount === option.count
                                ? 'border-primary bg-primary text-primary-foreground shadow-md scale-105'
                                : 'border-border hover:border-primary hover:border-opacity-50 hover:shadow-sm'
                            }`}
                          >
                            <div className="font-semibold">{option.count} bags</div>
                            <div className={`text-sm ${
                              formData.bagCount === option.count 
                                ? 'text-primary-foreground text-opacity-80' 
                                : 'text-muted-foreground'
                            }`}>${option.price}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="scheduledDate" className="text-sm font-medium mb-2 block">
                      {serviceType === 'subscription' ? 'Start Date' : 'Pickup Date'}
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="scheduledDate"
                        type="datetime-local"
                        value={formData.scheduledDate}
                        onChange={(e) => {
                          const selectedDate = new Date(e.target.value);
                          const now = new Date();
                          
                          // Prevent past dates
                          if (selectedDate < now) {
                            toast({
                              title: "Invalid Date",
                              description: "Please select a future date and time.",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          setFormData({...formData, scheduledDate: e.target.value})
                        }}
                        className="app-input pl-10 text-base cursor-pointer"
                        min={new Date().toISOString().slice(0, 16)}
                        required
                      />
                    </div>
                    {!formData.scheduledDate && (
                      <div className="text-xs text-muted-foreground mt-1 flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Select your preferred {serviceType === 'subscription' ? 'start' : 'pickup'} date and time</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Pickup Address</h3>
                <div className="space-y-4">
                  <AddressAutocomplete
                    value={formData.address}
                    onChange={(value) => setFormData({...formData, address: value})}
                    label="Street Address"
                    placeholder="Enter your pickup address"
                    required
                  />
                  
                  <div>
                    <Label htmlFor="instructions" className="text-sm font-medium mb-2 block">
                      Special Instructions (Optional)
                    </Label>
                    <Textarea
                      id="instructions"
                      value={formData.specialInstructions}
                      onChange={(e) => setFormData({...formData, specialInstructions: e.target.value})}
                      placeholder="Gate code, specific location, etc."
                      className="app-input min-h-20"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Confirm Booking</h3>
                
                <MobileCard className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Service</span>
                    <span className="font-medium">
                      {serviceType === 'subscription' ? 'Weekly Subscription' : 'One-Time Pickup'}
                    </span>
                  </div>
                  
                  {serviceType === 'one-time' && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Bags</span>
                      <span className="font-medium">{formData.bagCount} bags</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Date & Time</span>
                    <span className="font-medium">
                      {new Date(formData.scheduledDate).toLocaleDateString()} at {new Date(formData.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Address</span>
                    <span className="font-medium text-right">{formData.address}</span>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="text-2xl font-bold">
                        ${getCurrentPrice()}
                        {serviceType === 'subscription' && <span className="text-sm font-normal">/month</span>}
                      </span>
                    </div>
                  </div>
                </MobileCard>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-muted/20">
          <div className="flex gap-3">
            {currentStep > 1 && (
              <MobileButton
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                Back
              </MobileButton>
            )}
            <MobileButton
              variant="primary"
              onClick={handleNext}
              className="flex-1"
              disabled={
                (currentStep === 1 && !formData.scheduledDate) ||
                (currentStep === 2 && !formData.address)
              }
            >
              {currentStep === totalSteps ? (
                <>
                  Continue to Payment
                  <CreditCard className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </MobileButton>
          </div>
        </div>
      </div>
      
      {/* Test Payment Modal */}
      {showPaymentModal && paymentData && (
        <TestPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
          clientSecret={paymentData.clientSecret}
          amount={paymentData.amount}
          serviceType={serviceType}
          testMode={paymentData.testMode}
          testCards={paymentData.testCards}
        />
      )}
    </div>
  );
}